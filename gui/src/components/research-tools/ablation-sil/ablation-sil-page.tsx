import { useCallback } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { SetupPanel } from './setup-panel'
import { FlaggingProgress } from './flagging-progress'
import { ResultsPanel } from './results-panel'
import { ReportPanel } from './report-panel'
import { usePersistedState } from './use-persisted-state'
import type { AblationSilState, AblationDataset, FlaggedReview } from '../types'

const INITIAL_STATE: AblationSilState = {
  factsheet: '',
  modelId: '',
  datasets: [],
  phase: 'setup',
}

export function AblationSilPage() {
  const [state, setState] = usePersistedState<AblationSilState>(
    'ablation-sil-state',
    INITIAL_STATE,
  )

  const handleStartFlagging = useCallback(
    (factsheet: string, modelId: string, datasets: AblationDataset[]) => {
      setState({
        factsheet,
        modelId,
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

  if (state.phase === 'setup') {
    return <SetupPanel onStart={handleStartFlagging} />
  }

  if (state.phase === 'running') {
    return (
      <FlaggingProgress
        factsheet={state.factsheet}
        modelId={state.modelId}
        datasets={state.datasets}
        onComplete={handleFlaggingComplete}
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
        <TabsList>
          <TabsTrigger value="results">Review Flags</TabsTrigger>
          <TabsTrigger value="report" disabled={!allReviewed}>
            Report
          </TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="mt-4">
          <ResultsPanel
            datasets={state.datasets}
            onUpdateDataset={handleUpdateDataset}
            onReset={handleReset}
          />
        </TabsContent>

        <TabsContent value="report" className="mt-4">
          <ReportPanel datasets={state.datasets} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
