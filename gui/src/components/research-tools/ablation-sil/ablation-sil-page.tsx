import { useState, useCallback, useEffect } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { FolderOpen, Trash2, Loader2, X as XIcon } from 'lucide-react'
import { PYTHON_API_URL } from '@/lib/api-urls'
import { SetupPanel } from './setup-panel'
import { FlaggingProgress } from './flagging-progress'
import { ResultsPanel } from './results-panel'
import { ReportPanel } from './report-panel'
import { usePersistedState } from './use-persisted-state'
import type { AblationSilState, AblationDataset, FlaggedReview } from '../types'

const INITIAL_STATE: AblationSilState = {
  factsheet: '',
  modelId: '',
  batchSize: 25,
  parallel: true,
  localEndpoint: '',
  localApiKey: '',
  openrouterApiKey: '',
  datasets: [],
  phase: 'setup',
}

interface SavedReport {
  dirName: string
  path: string
  timestamp: string
  flaggerModel: string
  datasetCount: number
  totalFlagged: number
  totalReviews: number
}

export function AblationSilPage() {
  const [state, setState] = usePersistedState<AblationSilState>(
    'ablation-sil-state',
    INITIAL_STATE,
  )
  const [showSaved, setShowSaved] = useState(false)
  const [savedReports, setSavedReports] = useState<SavedReport[]>([])
  const [loadingSaved, setLoadingSaved] = useState(false)
  const [loadingReport, setLoadingReport] = useState<string | null>(null)
  const [deletingReport, setDeletingReport] = useState<string | null>(null)
  const [deleteConfirmPath, setDeleteConfirmPath] = useState<string | null>(null)
  const [loadedReportDir, setLoadedReportDir] = useState<string | null>(null)
  const [loadedReportPath, setLoadedReportPath] = useState<string | null>(null)

  // Fetch saved reports when popup opens
  useEffect(() => {
    if (!showSaved) return
    setLoadingSaved(true)
    fetch(`${PYTHON_API_URL}/api/list-ablation-reports?study_id=no-sil`)
      .then((res) => res.json())
      .then((data) => setSavedReports(data.reports || []))
      .catch(() => setSavedReports([]))
      .finally(() => setLoadingSaved(false))
  }, [showSaved])

  const handleLoadReport = useCallback(async (path: string) => {
    setLoadingReport(path)
    try {
      const res = await fetch(`${PYTHON_API_URL}/api/load-ablation-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()

      // Reconstruct state from saved data
      const datasets: AblationDataset[] = (data.datasets || []).map((ds: any, i: number) => ({
        id: `saved-${i}`,
        fileName: `${ds.domain}/${ds.mode}/${ds.size}-sent`,
        mode: ds.mode,
        domain: ds.domain,
        size: ds.size || ds.totalReviews || (ds.reviews?.length ?? 0),
        reviews: ds.reviews || [],
        flags: (ds.flags || []).map((f: any) => ({
          reviewIndex: f.reviewIndex,
          reason: f.reason,
          highlights: f.highlights || [],
          flagType: f.type || f.flagType || null,
          confirmed: f.confirmed ?? null,
        })),
        flaggingComplete: true,
      }))

      // Extract dir name from path
      const dirName = path.split('/').pop() || path
      setLoadedReportDir(dirName)
      setLoadedReportPath(path)

      setState({
        factsheet: data.config?.factsheet || '',
        modelId: data.config?.flaggerModel || '',
        batchSize: data.config?.batchSize || 25,
        parallel: data.config?.parallel || true,
        localEndpoint: '',
        localApiKey: '',
        openrouterApiKey: '',
        datasets,
        phase: 'results',
      })
      setShowSaved(false)
    } catch (err) {
      alert(`Failed to load: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoadingReport(null)
    }
  }, [setState])

  const handleDeleteReport = useCallback(async (path: string) => {
    setDeletingReport(path)
    try {
      const res = await fetch(`${PYTHON_API_URL}/api/delete-ablation-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      })
      if (!res.ok) throw new Error(await res.text())
      setSavedReports((prev) => prev.filter((r) => r.path !== path))
    } catch (err) {
      alert(`Delete failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setDeletingReport(null)
    }
  }, [])

  const handleStartFlagging = useCallback(
    (factsheet: string, modelId: string, datasets: AblationDataset[], batchSize: number, parallel: boolean, localEndpoint: string, localApiKey: string, openrouterApiKey: string) => {
      setState({
        factsheet,
        modelId,
        batchSize,
        parallel,
        localEndpoint,
        localApiKey,
        openrouterApiKey,
        datasets,
        phase: 'running',
      })
    },
    [setState],
  )

  const handleFlaggingComplete = useCallback(
    (datasets: AblationDataset[]) => {
      setState((prev) => ({
        ...prev,
        datasets,
        phase: 'results',
      }))
    },
    [setState],
  )

  const handleUpdateDataset = useCallback(
    (datasetId: string, flags: FlaggedReview[]) => {
      setState((prev) => ({
        ...prev,
        datasets: prev.datasets.map((ds) =>
          ds.id === datasetId ? { ...ds, flags } : ds,
        ),
      }))
    },
    [setState],
  )

  const handleReset = useCallback(() => {
    setState(INITIAL_STATE)
  }, [setState])

  // Saved Reports popup
  const savedReportsPopup = showSaved && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setShowSaved(false)}>
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Saved Reports</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowSaved(false)}>
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-y-auto max-h-[60vh] space-y-2">
          {loadingSaved && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {!loadingSaved && savedReports.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No saved reports yet.</p>
          )}
          {savedReports.map((report) => (
            <div
              key={report.path}
              className="flex items-center justify-between border rounded-lg px-4 py-3 hover:bg-muted/50 transition-colors"
            >
              <div
                className="flex-1 cursor-pointer"
                onClick={() => handleLoadReport(report.path)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {report.flaggerModel.replace('local/', '')}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {report.datasetCount} datasets
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {report.totalFlagged}/{report.totalReviews} flagged
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                  {report.dirName}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(report.timestamp).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-1 ml-3">
                {loadingReport === report.path && <Loader2 className="h-4 w-4 animate-spin" />}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); setDeleteConfirmPath(report.path) }}
                  disabled={deletingReport === report.path}
                >
                  {deletingReport === report.path
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  }
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )

  const deleteConfirmDialog = (
    <AlertDialog open={!!deleteConfirmPath} onOpenChange={(open) => !open && setDeleteConfirmPath(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete saved report?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this report and all its data. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => {
              if (deleteConfirmPath) {
                handleDeleteReport(deleteConfirmPath)
                setDeleteConfirmPath(null)
              }
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  if (state.phase === 'setup') {
    return (
      <>
        <div className="flex justify-end mb-4">
          <Button variant="outline" size="sm" onClick={() => setShowSaved(true)}>
            <FolderOpen className="h-4 w-4 mr-1" />
            View Saved Reports
          </Button>
        </div>
        <SetupPanel onStart={handleStartFlagging} />
        {savedReportsPopup}
        {deleteConfirmDialog}
      </>
    )
  }

  if (state.phase === 'running') {
    return (
      <FlaggingProgress
        factsheet={state.factsheet}
        modelId={state.modelId}
        batchSize={state.batchSize}
        parallel={state.parallel}
        localEndpoint={state.localEndpoint}
        localApiKey={state.localApiKey}
        openrouterApiKey={state.openrouterApiKey}
        datasets={state.datasets}
        onComplete={handleFlaggingComplete}
        onCancel={handleReset}
      />
    )
  }

  // results or report phase
  const allReviewed = state.datasets.every((ds) =>
    ds.flags.every((f) => f.confirmed !== null),
  )

  return (
    <div className="space-y-4">
      <Tabs defaultValue="results">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="results">Review Flags</TabsTrigger>
            <TabsTrigger value="report" disabled={!allReviewed}>
              Report
            </TabsTrigger>
          </TabsList>
          <Button variant="outline" size="sm" onClick={() => setShowSaved(true)}>
            <FolderOpen className="h-4 w-4 mr-1" />
            View Saved Reports
          </Button>
        </div>

        <TabsContent value="results" className="mt-4">
          <ResultsPanel
            datasets={state.datasets}
            modelId={state.modelId}
            batchSize={state.batchSize}
            parallel={state.parallel}
            factsheet={state.factsheet}
            reportDir={loadedReportDir || undefined}
            reportPath={loadedReportPath || undefined}
            onUpdateDataset={handleUpdateDataset}
            onReset={handleReset}
          />
        </TabsContent>

        <TabsContent value="report" className="mt-4">
          <ReportPanel datasets={state.datasets} modelId={state.modelId} />
        </TabsContent>
      </Tabs>
      {savedReportsPopup}
      {deleteConfirmDialog}
    </div>
  )
}
