import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { FileDropZone } from '@/components/ui/file-drop-zone'
import { LLMSelector } from '@/components/llm-selector'
import { useOpenRouterModels } from '@/hooks/use-openrouter-models'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trash2, Plus } from 'lucide-react'
import { parseJsonlFile } from './parse-jsonl'
import type {
  AblationDataset,
  AblationMode,
  AblationDomain,
} from '../types'
import { ABLATION_MODE_LABELS, ABLATION_DOMAIN_LABELS } from '../types'

interface SetupPanelProps {
  onStart: (factsheet: string, modelId: string, datasets: AblationDataset[]) => void
}

interface PendingDataset {
  id: string
  file: File | null
  fileName: string
  mode: AblationMode
  domain: AblationDomain
  size: number
  reviews: { index: number; text: string }[]
  loading: boolean
}

let nextId = 0
function genId() {
  return `ds-${Date.now()}-${nextId++}`
}

export function SetupPanel({ onStart }: SetupPanelProps) {
  const [factsheet, setFactsheet] = useState('')
  const [modelId, setModelId] = useState('')
  const [datasets, setDatasets] = useState<PendingDataset[]>([])
  const { providers, groupedModels, loading: modelsLoading } = useOpenRouterModels()

  const handleFactsheetFile = useCallback(async (file: File) => {
    const text = await file.text()
    setFactsheet(text)
  }, [])

  const handleAddDataset = useCallback(() => {
    setDatasets((prev) => [
      ...prev,
      {
        id: genId(),
        file: null,
        fileName: '',
        mode: 'cera-full',
        domain: 'laptop',
        size: 0,
        reviews: [],
        loading: false,
      },
    ])
  }, [])

  const handleRemoveDataset = useCallback((id: string) => {
    setDatasets((prev) => prev.filter((ds) => ds.id !== id))
  }, [])

  const handleDatasetFile = useCallback(async (id: string, file: File) => {
    setDatasets((prev) =>
      prev.map((ds) =>
        ds.id === id ? { ...ds, loading: true, file, fileName: file.name } : ds,
      ),
    )

    const reviews = await parseJsonlFile(file)

    setDatasets((prev) =>
      prev.map((ds) =>
        ds.id === id
          ? { ...ds, loading: false, reviews, size: reviews.length }
          : ds,
      ),
    )
  }, [])

  const handleDatasetField = useCallback(
    <K extends keyof PendingDataset>(id: string, field: K, value: PendingDataset[K]) => {
      setDatasets((prev) =>
        prev.map((ds) => (ds.id === id ? { ...ds, [field]: value } : ds)),
      )
    },
    [],
  )

  const canStart =
    factsheet.trim().length > 0 &&
    modelId.length > 0 &&
    datasets.length > 0 &&
    datasets.every((ds) => ds.reviews.length > 0 && !ds.loading)

  const handleStart = () => {
    const ablationDatasets: AblationDataset[] = datasets.map((ds) => ({
      id: ds.id,
      fileName: ds.fileName,
      mode: ds.mode,
      domain: ds.domain,
      size: ds.size,
      reviews: ds.reviews,
      flags: [],
      flaggingComplete: false,
    }))
    onStart(factsheet, modelId, ablationDatasets)
  }

  return (
    <div className="space-y-6">
      {/* Factsheet */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Ground Truth Factsheet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Paste the factsheet content here (markdown or plain text)..."
            value={factsheet}
            onChange={(e) => setFactsheet(e.target.value)}
            className="min-h-[160px] font-mono text-sm"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">or upload:</span>
            <FileDropZone
              accept=".md,.txt"
              onFile={handleFactsheetFile}
              placeholder="Drop .md or .txt file"
              className="flex-1"
            />
          </div>
          {factsheet && (
            <Badge variant="secondary" className="text-xs">
              {factsheet.split('\n').length} lines loaded
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Flagger Model */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Flagger Model</CardTitle>
        </CardHeader>
        <CardContent>
          <LLMSelector
            value={modelId}
            onChange={setModelId}
            placeholder="Select LLM for factual flagging..."
            providers={providers}
            groupedModels={groupedModels}
            loading={modelsLoading}
          />
        </CardContent>
      </Card>

      {/* Datasets */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Datasets</CardTitle>
            <Button variant="outline" size="sm" onClick={handleAddDataset}>
              <Plus className="h-4 w-4 mr-1" />
              Add Dataset
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {datasets.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              No datasets added yet. Click "Add Dataset" to upload JSONL files.
            </p>
          )}

          {datasets.map((ds) => (
            <div
              key={ds.id}
              className="border rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {ds.fileName || 'No file selected'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveDataset(ds.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <FileDropZone
                accept=".jsonl"
                onFile={(file) => handleDatasetFile(ds.id, file)}
                placeholder="Drop a .jsonl file"
                selectedFileName={ds.fileName || null}
              />

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Mode</Label>
                  <Select
                    value={ds.mode}
                    onValueChange={(v) =>
                      handleDatasetField(ds.id, 'mode', v as AblationMode)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(ABLATION_MODE_LABELS) as AblationMode[]).map(
                        (mode) => (
                          <SelectItem key={mode} value={mode}>
                            {ABLATION_MODE_LABELS[mode]}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Domain</Label>
                  <Select
                    value={ds.domain}
                    onValueChange={(v) =>
                      handleDatasetField(ds.id, 'domain', v as AblationDomain)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        Object.keys(ABLATION_DOMAIN_LABELS) as AblationDomain[]
                      ).map((domain) => (
                        <SelectItem key={domain} value={domain}>
                          {ABLATION_DOMAIN_LABELS[domain]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Size</Label>
                  <Input
                    type="number"
                    value={ds.size}
                    onChange={(e) =>
                      handleDatasetField(
                        ds.id,
                        'size',
                        parseInt(e.target.value, 10) || 0,
                      )
                    }
                    className="h-9"
                  />
                </div>
              </div>

              {ds.loading && (
                <p className="text-xs text-muted-foreground">Parsing file...</p>
              )}
              {!ds.loading && ds.reviews.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {ds.reviews.length} reviews parsed
                </Badge>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Start Button */}
      <Button onClick={handleStart} disabled={!canStart} className="w-full">
        Run Flagging
      </Button>
    </div>
  )
}
