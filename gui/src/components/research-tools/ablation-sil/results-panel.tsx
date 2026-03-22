import { useMemo, useCallback } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Check, X, Undo2, RotateCcw } from 'lucide-react'
import type { AblationDataset, AblationDomain, AblationMode, FlaggedReview } from '../types'
import { ABLATION_MODE_LABELS, ABLATION_DOMAIN_LABELS } from '../types'

interface ResultsPanelProps {
  datasets: AblationDataset[]
  onUpdateDataset: (datasetId: string, flags: FlaggedReview[]) => void
  onReset: () => void
}

export function ResultsPanel({ datasets, onUpdateDataset, onReset }: ResultsPanelProps) {
  // Group datasets by domain
  const domains = useMemo(() => {
    const domainSet = new Set(datasets.map((ds) => ds.domain))
    return Array.from(domainSet) as AblationDomain[]
  }, [datasets])

  const defaultDomain = domains[0] || 'laptop'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          Review flagged items across datasets
        </h3>
        <Button variant="outline" size="sm" onClick={onReset}>
          <RotateCcw className="h-4 w-4 mr-1" />
          Start Over
        </Button>
      </div>

      <Tabs defaultValue={defaultDomain}>
        <TabsList>
          {domains.map((domain) => (
            <TabsTrigger key={domain} value={domain}>
              {ABLATION_DOMAIN_LABELS[domain]}
            </TabsTrigger>
          ))}
        </TabsList>

        {domains.map((domain) => (
          <TabsContent key={domain} value={domain} className="mt-4">
            <DomainResults
              datasets={datasets.filter((ds) => ds.domain === domain)}
              onUpdateDataset={onUpdateDataset}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

function DomainResults({
  datasets,
  onUpdateDataset,
}: {
  datasets: AblationDataset[]
  onUpdateDataset: (datasetId: string, flags: FlaggedReview[]) => void
}) {
  const modes = useMemo(() => {
    const modeSet = new Set(datasets.map((ds) => ds.mode))
    return Array.from(modeSet) as AblationMode[]
  }, [datasets])

  const defaultMode = modes[0] || 'cera-full'

  return (
    <Tabs defaultValue={defaultMode}>
      <TabsList>
        {modes.map((mode) => {
          const modeDatasets = datasets.filter((ds) => ds.mode === mode)
          const totalFlags = modeDatasets.reduce((sum, ds) => sum + ds.flags.length, 0)
          const reviewedFlags = modeDatasets.reduce(
            (sum, ds) => sum + ds.flags.filter((f) => f.confirmed !== null).length,
            0,
          )
          return (
            <TabsTrigger key={mode} value={mode}>
              {ABLATION_MODE_LABELS[mode]}
              {totalFlags > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {reviewedFlags}/{totalFlags}
                </Badge>
              )}
            </TabsTrigger>
          )
        })}
      </TabsList>

      {modes.map((mode) => (
        <TabsContent key={mode} value={mode} className="mt-4 space-y-4">
          {datasets
            .filter((ds) => ds.mode === mode)
            .map((ds) => (
              <DatasetReviewer
                key={ds.id}
                dataset={ds}
                onUpdateFlags={(flags) => onUpdateDataset(ds.id, flags)}
              />
            ))}
        </TabsContent>
      ))}
    </Tabs>
  )
}

function DatasetReviewer({
  dataset,
  onUpdateFlags,
}: {
  dataset: AblationDataset
  onUpdateFlags: (flags: FlaggedReview[]) => void
}) {
  const totalFlags = dataset.flags.length
  const reviewedCount = dataset.flags.filter((f) => f.confirmed !== null).length
  const remainingCount = totalFlags - reviewedCount

  // Current flag to review: the first unreviewed one
  const currentFlag = useMemo(() => {
    return dataset.flags.find((f) => f.confirmed === null) || null
  }, [dataset.flags])

  // Find the review text for a given flag
  const getReviewText = useCallback(
    (reviewIndex: number) => {
      const review = dataset.reviews.find((r) => r.index === reviewIndex)
      return review?.text || '[Review text not found]'
    },
    [dataset.reviews],
  )

  const handleConfirm = useCallback(() => {
    if (!currentFlag) return
    const newFlags = dataset.flags.map((f) =>
      f.reviewIndex === currentFlag.reviewIndex && f.confirmed === null
        ? { ...f, confirmed: true as const }
        : f,
    )
    onUpdateFlags(newFlags)
  }, [currentFlag, dataset.flags, onUpdateFlags])

  const handleReject = useCallback(() => {
    if (!currentFlag) return
    const newFlags = dataset.flags.map((f) =>
      f.reviewIndex === currentFlag.reviewIndex && f.confirmed === null
        ? { ...f, confirmed: false as const }
        : f,
    )
    onUpdateFlags(newFlags)
  }, [currentFlag, dataset.flags, onUpdateFlags])

  const handleUndo = useCallback(() => {
    // Find the last reviewed flag (most recently changed to non-null)
    // We look backwards through the flags array for the last one that has been reviewed
    const reviewedFlags = dataset.flags
      .map((f, i) => ({ flag: f, originalIndex: i }))
      .filter((entry) => entry.flag.confirmed !== null)
    if (reviewedFlags.length === 0) return

    const lastReviewed = reviewedFlags[reviewedFlags.length - 1]
    const newFlags = dataset.flags.map((f, i) =>
      i === lastReviewed.originalIndex ? { ...f, confirmed: null } : f,
    )
    onUpdateFlags(newFlags)
  }, [dataset.flags, onUpdateFlags])

  const allDone = remainingCount === 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{dataset.fileName}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {dataset.size} reviews
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {totalFlags} flagged
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats row */}
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>Total: {dataset.reviews.length}</span>
          <span>Flagged: {totalFlags}</span>
          <span>Reviewed: {reviewedCount}</span>
          <span>
            Confirmed: {dataset.flags.filter((f) => f.confirmed === true).length}
          </span>
          <span>
            Rejected: {dataset.flags.filter((f) => f.confirmed === false).length}
          </span>
        </div>

        {/* Queue card */}
        {!allDone && currentFlag ? (
          <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {remainingCount} of {totalFlags} remaining
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUndo}
                disabled={reviewedCount === 0}
              >
                <Undo2 className="h-3 w-3 mr-1" />
                Undo
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-sm leading-relaxed">
                {getReviewText(currentFlag.reviewIndex)}
              </p>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded px-3 py-2">
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  <span className="font-medium">Flag reason:</span>{' '}
                  {currentFlag.reason}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={handleConfirm}
                className="flex-1"
              >
                <Check className="h-4 w-4 mr-1" />
                Confirm Error
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleReject}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-1" />
                Reject Flag
              </Button>
            </div>
          </div>
        ) : allDone && totalFlags > 0 ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            All {totalFlags} flags have been reviewed.
          </div>
        ) : totalFlags === 0 ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            No flags found for this dataset.
          </div>
        ) : null}

        {/* All flags list */}
        {totalFlags > 0 && (
          <details className="text-sm">
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
              View all {totalFlags} flags
            </summary>
            <ScrollArea className="mt-2 max-h-[300px]">
              <div className="space-y-2">
                {dataset.flags.map((flag, i) => (
                  <div
                    key={`${flag.reviewIndex}-${i}`}
                    className={`border rounded px-3 py-2 text-xs ${
                      flag.confirmed === true
                        ? 'border-red-500/30 bg-red-500/5'
                        : flag.confirmed === false
                          ? 'border-muted bg-muted/30 opacity-60'
                          : 'border-yellow-500/30 bg-yellow-500/5'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">Review #{flag.reviewIndex}</span>
                      {flag.confirmed === true && (
                        <Badge variant="destructive" className="text-[10px]">
                          Confirmed
                        </Badge>
                      )}
                      {flag.confirmed === false && (
                        <Badge variant="secondary" className="text-[10px]">
                          Rejected
                        </Badge>
                      )}
                      {flag.confirmed === null && (
                        <Badge variant="outline" className="text-[10px]">
                          Pending
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground">{flag.reason}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </details>
        )}
      </CardContent>
    </Card>
  )
}
