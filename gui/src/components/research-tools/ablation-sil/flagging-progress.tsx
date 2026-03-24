import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { XCircle } from 'lucide-react'
import { PYTHON_API_URL } from '@/lib/api-urls'
import type { AblationDataset, FlaggedReview } from '../types'
import { ABLATION_MODE_LABELS, ABLATION_DOMAIN_LABELS } from '../types'

interface FlaggingProgressProps {
  factsheet: string
  modelId: string
  batchSize: number
  parallel: boolean
  localEndpoint: string
  localApiKey: string
  openrouterApiKey: string
  datasets: AblationDataset[]
  onComplete: (datasets: AblationDataset[]) => void
  onCancel: () => void
}

interface DatasetProgress {
  status: 'pending' | 'running' | 'done' | 'error'
  flagCount: number
  error?: string
}

async function flagOneDataset(
  ds: AblationDataset,
  factsheet: string,
  modelId: string,
  batchSize: number,
  localEndpoint: string,
  localApiKey: string,
  openrouterApiKey: string,
): Promise<{ id: string; flags: FlaggedReview[]; error?: string }> {
  try {
    const res = await fetch(`${PYTHON_API_URL}/api/flag-reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        factsheet,
        reviews: ds.reviews,
        model_id: modelId,
        batch_size: batchSize,
        local_endpoint: localEndpoint,
        local_api_key: localApiKey,
        openrouter_api_key: openrouterApiKey,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(errText || `HTTP ${res.status}`)
    }

    const data = await res.json()
    const flags: FlaggedReview[] = (data.flags || []).map(
      (f: { review_index: number; reason: string; highlights?: string[]; type?: string }) => ({
        reviewIndex: f.review_index,
        reason: f.reason,
        highlights: f.highlights || [],
        flagType: f.type || null,
        confirmed: null,
      }),
    )

    return { id: ds.id, flags }
  } catch (err) {
    return { id: ds.id, flags: [], error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export function FlaggingProgress({
  factsheet,
  modelId,
  batchSize,
  parallel,
  localEndpoint,
  localApiKey,
  openrouterApiKey,
  datasets,
  onComplete,
  onCancel,
}: FlaggingProgressProps) {
  const [progress, setProgress] = useState<Record<string, DatasetProgress>>(() => {
    const init: Record<string, DatasetProgress> = {}
    for (const ds of datasets) {
      init[ds.id] = { status: 'pending', flagCount: 0 }
    }
    return init
  })
  const resultsRef = useRef<AblationDataset[]>([...datasets])
  const runningRef = useRef(false)

  useEffect(() => {
    if (runningRef.current) return
    runningRef.current = true

    async function runSequential() {
      for (const ds of datasets) {
        setProgress((prev) => ({ ...prev, [ds.id]: { status: 'running', flagCount: 0 } }))

        const result = await flagOneDataset(ds, factsheet, modelId, batchSize, localEndpoint, localApiKey, openrouterApiKey)

        resultsRef.current = resultsRef.current.map((d) =>
          d.id === result.id
            ? { ...d, flags: result.flags, flaggingComplete: true }
            : d,
        )

        setProgress((prev) => ({
          ...prev,
          [result.id]: result.error
            ? { status: 'error', flagCount: 0, error: result.error }
            : { status: 'done', flagCount: result.flags.length },
        }))
      }

      onComplete(resultsRef.current)
    }

    async function runParallel() {
      // Mark all as running
      setProgress((prev) => {
        const next = { ...prev }
        for (const ds of datasets) {
          next[ds.id] = { status: 'running', flagCount: 0 }
        }
        return next
      })

      const promises = datasets.map((ds) =>
        flagOneDataset(ds, factsheet, modelId, batchSize, localEndpoint, localApiKey, openrouterApiKey).then((result) => {
          resultsRef.current = resultsRef.current.map((d) =>
            d.id === result.id
              ? { ...d, flags: result.flags, flaggingComplete: true }
              : d,
          )

          setProgress((prev) => ({
            ...prev,
            [result.id]: result.error
              ? { status: 'error', flagCount: 0, error: result.error }
              : { status: 'done', flagCount: result.flags.length },
          }))

          return result
        }),
      )

      await Promise.all(promises)
      onComplete(resultsRef.current)
    }

    if (parallel) {
      runParallel()
    } else {
      runSequential()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const completedCount = Object.values(progress).filter(
    (p) => p.status === 'done' || p.status === 'error',
  ).length
  const overallPercent = datasets.length > 0
    ? Math.round((completedCount / datasets.length) * 100)
    : 0

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Flagging Progress</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {parallel ? 'Parallel' : 'Sequential'}
              </Badge>
              <Button variant="destructive" size="sm" onClick={onCancel}>
                <XCircle className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                {completedCount} of {datasets.length} datasets processed
              </span>
              <span>{overallPercent}%</span>
            </div>
            <Progress value={overallPercent} />
          </div>

          <div className="space-y-2">
            {datasets.map((ds) => {
              const p = progress[ds.id]
              return (
                <div
                  key={ds.id}
                  className="flex items-center justify-between border rounded-lg px-4 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{ds.fileName}</span>
                    <Badge variant="outline" className="text-xs">
                      {ABLATION_MODE_LABELS[ds.mode]}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {ABLATION_DOMAIN_LABELS[ds.domain]}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    {p.status === 'pending' && (
                      <Badge variant="secondary" className="text-xs">
                        Pending
                      </Badge>
                    )}
                    {p.status === 'running' && (
                      <Badge className="text-xs bg-blue-500/15 text-blue-500 border-blue-500/20">
                        Running...
                      </Badge>
                    )}
                    {p.status === 'done' && (
                      <Badge className={`text-xs ${p.flagCount > 0 ? 'bg-yellow-500/15 text-yellow-600 border-yellow-500/20' : 'bg-green-500/15 text-green-500 border-green-500/20'}`}>
                        {p.flagCount} flags
                      </Badge>
                    )}
                    {p.status === 'error' && (
                      <Badge variant="destructive" className="text-xs">
                        Error
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
