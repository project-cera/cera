import { useState, useEffect, useMemo } from 'react'
import type { ProcessedModel, GroupedModels, ProviderInfo } from './use-openrouter-models'

const PYTHON_API = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8000'

interface NativeProviderData {
  configured: boolean
  label: string
  models: Array<{
    id: string
    name: string
    context_length: number
    provider: string
  }>
}

interface NativeModelsResponse {
  providers: Record<string, NativeProviderData>
}

export function useNativeModels() {
  const [data, setData] = useState<NativeModelsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchModels() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${PYTHON_API}/api/native-models`, {
          signal: AbortSignal.timeout(30000),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json: NativeModelsResponse = await res.json()
        if (!cancelled) setData(json)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to fetch native models')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchModels()
    // Refresh every 5 minutes (model lists don't change often)
    const interval = setInterval(fetchModels, 300000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const models = useMemo<ProcessedModel[]>(() => {
    if (!data) return []

    const result: ProcessedModel[] = []
    for (const [providerKey, provider] of Object.entries(data.providers)) {
      if (!provider.configured || provider.models.length === 0) continue

      for (const m of provider.models) {
        result.push({
          id: `native/${providerKey}/${m.id}`,
          name: m.name || m.id,
          contextLength: m.context_length || 128000,
          pricing: 'Native API',
          isFree: false,
          provider: `${providerKey}-native`,
          providerLabel: provider.label,
          isOpenSource: false,
          inputModalities: ['text'],
          outputModalities: ['text'],
          hasVision: false,
          hasAudio: false,
          hasVideo: false,
          hasThinking: false,
        })
      }
    }
    return result
  }, [data])

  const groupedModels = useMemo<GroupedModels>(() => {
    if (!data) return {}
    const groups: GroupedModels = {}
    for (const [providerKey, provider] of Object.entries(data.providers)) {
      if (!provider.configured || provider.models.length === 0) continue
      const key = `${providerKey}-native`
      groups[key] = {
        label: provider.label,
        models: models.filter(m => m.provider === key),
      }
    }
    return groups
  }, [data, models])

  const providers = useMemo<ProviderInfo[]>(() => {
    if (!data) return []
    const result: ProviderInfo[] = []
    for (const [providerKey, provider] of Object.entries(data.providers)) {
      if (!provider.configured || provider.models.length === 0) continue
      result.push({
        id: `${providerKey}-native`,
        label: provider.label,
        modelCount: provider.models.length,
        isOpenSource: false,
        hasFreeModels: false,
        hasPaidModels: true,
      })
    }
    return result
  }, [data])

  return {
    models,
    groupedModels,
    providers,
    loading,
    error,
    configuredProviders: data
      ? Object.entries(data.providers)
          .filter(([, p]) => p.configured)
          .map(([k]) => k)
      : [],
  }
}
