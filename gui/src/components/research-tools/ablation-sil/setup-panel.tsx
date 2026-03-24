import { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { FileDropZone } from '@/components/ui/file-drop-zone'
import { LLMSelector } from '@/components/llm-selector'
import { useOpenRouterModels } from '@/hooks/use-openrouter-models'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trash2, Plus, FolderOpen, Loader2 } from 'lucide-react'
import { PYTHON_API_URL } from '@/lib/api-urls'
import { parseJsonlFile } from './parse-jsonl'
import type {
  AblationDataset,
  AblationMode,
  AblationDomain,
} from '../types'
import { ABLATION_MODE_LABELS, ABLATION_DOMAIN_LABELS } from '../types'

interface SetupPanelProps {
  onStart: (factsheet: string, modelId: string, datasets: AblationDataset[], batchSize: number, parallel: boolean, localEndpoint: string, localApiKey: string, openrouterApiKey: string) => void
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
  fromJob?: boolean
}

interface JobListItem {
  dirName: string
  path: string
  jobId: string
  jobName: string
  hasDataset: boolean
}

interface ScannedSize {
  size: number
  filePath: string
  fileName: string
  reviewCount: number
  selected: boolean
}

let nextId = 0
function genId() {
  return `ds-${Date.now()}-${nextId++}`
}

export function SetupPanel({ onStart }: SetupPanelProps) {
  const [factsheet, setFactsheet] = useState('')
  const [modelId, setModelId] = useState('')
  const [batchSize, setBatchSize] = useState(25)
  const [parallel, setParallel] = useState(true)
  const [datasets, setDatasets] = useState<PendingDataset[]>([])
  const { providers, groupedModels, loading: modelsLoading } = useOpenRouterModels()
  const settings = useQuery(api.settings.get)

  // Job list + import state
  const [jobList, setJobList] = useState<JobListItem[]>([])
  const [jobListLoading, setJobListLoading] = useState(false)
  const [selectedJobPath, setSelectedJobPath] = useState('')
  const [jobImportMode, setJobImportMode] = useState<AblationMode>('cera-full')
  const [jobScanning, setJobScanning] = useState(false)
  const [jobScanResult, setJobScanResult] = useState<{
    jobName: string
    domain: AblationDomain
    sizes: ScannedSize[]
  } | null>(null)
  const [jobScanError, setJobScanError] = useState('')

  // Fetch job list on mount
  useEffect(() => {
    async function fetchJobs() {
      setJobListLoading(true)
      try {
        const res = await fetch(`${PYTHON_API_URL}/api/jobs-list`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setJobList((data.jobs || []).filter((j: JobListItem) => j.hasDataset))
      } catch {
        setJobList([])
      } finally {
        setJobListLoading(false)
      }
    }
    fetchJobs()
  }, [])

  const handleFactsheetFile = useCallback(async (file: File) => {
    const text = await file.text()
    setFactsheet(text)
  }, [])

  // --- Manual dataset add ---
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

  // --- Job import ---
  const handleJobSelect = useCallback(async (jobPath: string) => {
    setSelectedJobPath(jobPath)
    setJobScanError('')
    setJobScanResult(null)

    if (!jobPath) return

    setJobScanning(true)
    try {
      const res = await fetch(`${PYTHON_API_URL}/api/scan-job-datasets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDir: jobPath }),
      })
      if (!res.ok) {
        const errText = await res.text()
        throw new Error(errText || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setJobScanResult({
        jobName: data.jobName,
        domain: data.domain as AblationDomain,
        sizes: (data.sizes || []).map((s: ScannedSize) => ({ ...s, selected: true })),
      })
    } catch (err) {
      setJobScanError(err instanceof Error ? err.message : 'Scan failed')
    } finally {
      setJobScanning(false)
    }
  }, [])

  const handleToggleSize = useCallback((size: number) => {
    setJobScanResult((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        sizes: prev.sizes.map((s) =>
          s.size === size ? { ...s, selected: !s.selected } : s,
        ),
      }
    })
  }, [])

  const handleImportFromJob = useCallback(async () => {
    if (!jobScanResult) return
    const selected = jobScanResult.sizes.filter((s) => s.selected)
    if (selected.length === 0) return

    for (const s of selected) {
      const id = genId()
      setDatasets((prev) => [
        ...prev,
        {
          id,
          file: null,
          fileName: `${jobScanResult.jobName} / ${s.size} sent`,
          mode: jobImportMode,
          domain: jobScanResult.domain,
          size: s.reviewCount,
          reviews: [],
          loading: true,
          fromJob: true,
        },
      ])

      try {
        const res = await fetch(`${PYTHON_API_URL}/api/read-job-dataset`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filePath: s.filePath }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setDatasets((prev) =>
          prev.map((ds) =>
            ds.id === id
              ? { ...ds, loading: false, reviews: data.reviews, size: data.totalReviews }
              : ds,
          ),
        )
      } catch {
        setDatasets((prev) =>
          prev.map((ds) =>
            ds.id === id ? { ...ds, loading: false } : ds,
          ),
        )
      }
    }

    // Reset job selector
    setJobScanResult(null)
    setSelectedJobPath('')
  }, [jobScanResult, jobImportMode])

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
    const localEndpoint = settings?.localLlmEndpoint ?? ''
    const localApiKey = settings?.localLlmApiKey ?? ''
    const openrouterApiKey = settings?.openrouterApiKey ?? ''
    onStart(factsheet, modelId, ablationDatasets, batchSize, parallel, localEndpoint, localApiKey, openrouterApiKey)
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

      {/* Flagger Model + Batch Size */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Flagger Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs">Flagger Model</Label>
            <LLMSelector
              value={modelId}
              onChange={setModelId}
              placeholder="Select LLM for factual flagging..."
              providers={providers}
              groupedModels={groupedModels}
              loading={modelsLoading}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Batch Size (reviews per API call)</Label>
            <Input
              type="number"
              value={batchSize}
              onChange={(e) => setBatchSize(Math.max(1, parseInt(e.target.value, 10) || 25))}
              className="h-9 w-32"
              min={1}
              max={100}
            />
            <p className="text-xs text-muted-foreground">
              How many reviews to send per LLM call. Lower = more accurate, higher = faster.
            </p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Processing Mode</Label>
            <div className="flex gap-1 p-1 rounded-md border bg-muted/30 w-fit">
              <button
                type="button"
                onClick={() => setParallel(false)}
                className={`px-3 py-1 rounded text-xs transition-colors ${
                  !parallel ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sequential
              </button>
              <button
                type="button"
                onClick={() => setParallel(true)}
                className={`px-3 py-1 rounded text-xs transition-colors ${
                  parallel ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Parallel
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {parallel ? 'All datasets flagged simultaneously.' : 'Datasets flagged one at a time.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Datasets */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Datasets</CardTitle>
            <Button variant="outline" size="sm" onClick={handleAddDataset}>
              <Plus className="h-4 w-4 mr-1" />
              Add File
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Import from Job */}
          <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Import from Job</span>
            </div>

            <Select
              value={selectedJobPath}
              onValueChange={handleJobSelect}
              disabled={jobListLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={jobListLoading ? 'Loading jobs...' : 'Select a job...'} />
              </SelectTrigger>
              <SelectContent>
                {jobList.map((job) => (
                  <SelectItem key={job.dirName} value={job.path}>
                    <span className="font-mono text-xs">{job.jobName}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {jobScanning && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Scanning job for datasets...
              </div>
            )}

            {jobScanError && (
              <p className="text-xs text-destructive">{jobScanError}</p>
            )}

            {jobScanResult && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Label className="text-xs">Mode:</Label>
                    <Select value={jobImportMode} onValueChange={(v) => setJobImportMode(v as AblationMode)}>
                      <SelectTrigger className="h-7 w-36 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(ABLATION_MODE_LABELS) as AblationMode[]).map((m) => (
                          <SelectItem key={m} value={m}>{ABLATION_MODE_LABELS[m]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {ABLATION_DOMAIN_LABELS[jobScanResult.domain]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {jobScanResult.sizes.length} sizes found
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {jobScanResult.sizes.map((s) => (
                    <button
                      key={s.size}
                      type="button"
                      onClick={() => handleToggleSize(s.size)}
                      className={`px-3 py-1.5 rounded-md border text-sm transition-colors ${
                        s.selected
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-muted-foreground border-border hover:bg-muted'
                      }`}
                    >
                      {s.size} sent ({s.reviewCount} reviews)
                    </button>
                  ))}
                </div>

                <Button
                  size="sm"
                  onClick={handleImportFromJob}
                  disabled={jobScanResult.sizes.filter((s) => s.selected).length === 0}
                >
                  Import {jobScanResult.sizes.filter((s) => s.selected).length} dataset(s)
                </Button>
              </div>
            )}
          </div>

          {/* Dataset list */}
          {datasets.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No datasets added yet. Import from a job above or click "Add File" to upload JSONL files.
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

              {!ds.fromJob && (
                <FileDropZone
                  accept=".jsonl"
                  onFile={(file) => handleDatasetFile(ds.id, file)}
                  placeholder="Drop a .jsonl file"
                  selectedFileName={ds.fileName || null}
                />
              )}

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
                  <Label className="text-xs">Reviews</Label>
                  <Input
                    type="number"
                    value={ds.size}
                    readOnly={ds.fromJob}
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
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading reviews...
                </div>
              )}
              {!ds.loading && ds.reviews.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {ds.reviews.length} reviews loaded
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
