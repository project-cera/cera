import { useState, useMemo, useCallback } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, X, Undo2, RotateCcw, Save, Loader2 } from 'lucide-react'
import { PYTHON_API_URL } from '@/lib/api-urls'
import type { AblationDataset, AblationDomain, AblationMode, FlaggedReview } from '../types'
import { ABLATION_MODE_LABELS, ABLATION_DOMAIN_LABELS } from '../types'

/** Highlight matching phrases in text. Returns JSX with red marks for matches. */
function HighlightedText({ text, highlights }: { text: string; highlights: string[] }) {
  if (!highlights || highlights.length === 0) {
    return <>{text}</>
  }

  // Build a case-insensitive regex that matches any of the highlight phrases
  const escaped = highlights
    .filter((h) => h.length > 0)
    .map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  if (escaped.length === 0) return <>{text}</>

  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi')
  const parts = text.split(pattern)

  return (
    <>
      {parts.map((part, i) => {
        const isMatch = highlights.some((h) => h.toLowerCase() === part.toLowerCase())
        return isMatch ? (
          <mark key={i} className="bg-red-200 dark:bg-red-900/50 text-red-800 dark:text-red-200 rounded px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      })}
    </>
  )
}

interface ResultsPanelProps {
  datasets: AblationDataset[]
  modelId: string
  batchSize: number
  parallel: boolean
  factsheet: string
  reportDir?: string
  reportPath?: string
  onUpdateDataset: (datasetId: string, flags: FlaggedReview[]) => void
  onReset: () => void
}

export function ResultsPanel({ datasets, modelId, batchSize, parallel, factsheet, reportDir, reportPath, onUpdateDataset, onReset }: ResultsPanelProps) {
  const [saving, setSaving] = useState(false)
  const [savedPath, setSavedPath] = useState<string | null>(null)

  const handleSaveReport = useCallback(async () => {
    setSaving(true)
    try {
      // Compute summary stats
      const modes = [...new Set(datasets.map((ds) => ds.mode))] as AblationMode[]
      const domains = [...new Set(datasets.map((ds) => ds.domain))] as AblationDomain[]

      const computeStats = (dsList: AblationDataset[]) => {
        const totalReviews = dsList.reduce((s, ds) => s + ds.reviews.length, 0)
        const flaggedCount = dsList.reduce((s, ds) => s + ds.flags.length, 0)
        const confirmedErrors = dsList.reduce((s, ds) => s + ds.flags.filter((f) => f.confirmed === true).length, 0)
        const rejectedFlags = dsList.reduce((s, ds) => s + ds.flags.filter((f) => f.confirmed === false).length, 0)
        const errorRate = totalReviews > 0 ? ((confirmedErrors / totalReviews) * 100).toFixed(2) : '0.00'
        return { totalReviews, flaggedCount, confirmedErrors, rejectedFlags, errorRate }
      }

      const overall: Record<string, ReturnType<typeof computeStats>> = {}
      for (const m of modes) overall[m] = computeStats(datasets.filter((ds) => ds.mode === m))
      const perDomain: Record<string, Record<string, ReturnType<typeof computeStats>>> = {}
      for (const d of domains) {
        perDomain[d] = {}
        for (const m of modes) perDomain[d][m] = computeStats(datasets.filter((ds) => ds.domain === d && ds.mode === m))
      }

      const flaggedIndicesSet = (ds: AblationDataset) => new Set(ds.flags.map((f) => f.reviewIndex))

      const res = await fetch(`${PYTHON_API_URL}/api/save-ablation-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studyId: 'no-sil',
          flaggerModel: modelId,
          batchSize,
          parallel,
          factsheet,
          factsheetLineCount: factsheet.split('\n').length,
          existingPath: reportPath || '',
          datasets: datasets.map((ds) => ({
            fileName: ds.fileName,
            mode: ds.mode,
            domain: ds.domain,
            size: ds.size,
            totalReviews: ds.reviews.length,
            reviews: ds.reviews,
            flags: ds.flags,
            passedReviewIndices: ds.reviews.filter((r) => !flaggedIndicesSet(ds).has(r.index)).map((r) => r.index),
          })),
          summary: { overall, perDomain },
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setSavedPath(data.path)
    } catch (err) {
      alert(`Save failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }, [datasets, modelId, batchSize, parallel, factsheet])
  // Group datasets by domain
  const domains = useMemo(() => {
    const domainSet = new Set(datasets.map((ds) => ds.domain))
    return Array.from(domainSet) as AblationDomain[]
  }, [datasets])

  const defaultDomain = domains[0] || 'laptop'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">
            Review flagged items across datasets
          </h3>
          <p className="text-xs text-muted-foreground">Flagger: {modelId.replace('local/', '')}</p>
          {reportDir && <p className="text-xs text-muted-foreground font-mono">{reportDir}</p>}
        </div>
        <div className="flex items-center gap-2">
          {savedPath && (
            <span className="text-xs text-green-600 dark:text-green-400">Saved to {savedPath}</span>
          )}
          <Button variant="default" size="sm" onClick={handleSaveReport} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Save Report
          </Button>
          <Button variant="outline" size="sm" onClick={onReset}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Start Over
          </Button>
        </div>
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

type ReviewView = 'flagged' | 'passed' | 'all'

function DatasetReviewer({
  dataset,
  onUpdateFlags,
}: {
  dataset: AblationDataset
  onUpdateFlags: (flags: FlaggedReview[]) => void
}) {
  const [viewMode, setViewMode] = useState<ReviewView>('flagged')
  const totalFlags = dataset.flags.length
  const reviewedCount = dataset.flags.filter((f) => f.confirmed !== null).length
  const remainingCount = totalFlags - reviewedCount
  const flaggedIndices = useMemo(() => new Set(dataset.flags.map((f) => f.reviewIndex)), [dataset.flags])
  const passedReviews = useMemo(() => dataset.reviews.filter((r) => !flaggedIndices.has(r.index)), [dataset.reviews, flaggedIndices])

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

  const handleConfirmAll = useCallback(() => {
    const newFlags = dataset.flags.map((f) =>
      f.confirmed === null ? { ...f, confirmed: true as const } : f,
    )
    onUpdateFlags(newFlags)
  }, [dataset.flags, onUpdateFlags])

  const handleRejectAll = useCallback(() => {
    const newFlags = dataset.flags.map((f) =>
      f.confirmed === null ? { ...f, confirmed: false as const } : f,
    )
    onUpdateFlags(newFlags)
  }, [dataset.flags, onUpdateFlags])

  const handleResetAll = useCallback(() => {
    const newFlags = dataset.flags.map((f) => ({ ...f, confirmed: null }))
    onUpdateFlags(newFlags)
  }, [dataset.flags, onUpdateFlags])

  const allDone = remainingCount === 0
  const [showCount, setShowCount] = useState(20)

  // Build flag lookup for quick access
  const flagByReviewIndex = useMemo(() => {
    const map = new Map<number, FlaggedReview>()
    for (const f of dataset.flags) map.set(f.reviewIndex, f)
    return map
  }, [dataset.flags])

  // All reviews in original order with flag info
  const allReviewsOrdered = useMemo(() =>
    dataset.reviews.map((r) => ({
      ...r,
      flag: flagByReviewIndex.get(r.index) || null,
    })),
    [dataset.reviews, flagByReviewIndex],
  )

  // Filtered list based on view mode
  const displayedReviews = useMemo(() => {
    if (viewMode === 'flagged') return allReviewsOrdered.filter((r) => r.flag)
    if (viewMode === 'passed') return allReviewsOrdered.filter((r) => !r.flag)
    return allReviewsOrdered
  }, [allReviewsOrdered, viewMode])

  const visibleReviews = displayedReviews.slice(0, showCount)
  const hasMore = displayedReviews.length > showCount

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{dataset.fileName}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {dataset.reviews.length} reviews
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {totalFlags} flagged
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats + view toggle */}
        <div className="flex items-center justify-between">
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>Total: {dataset.reviews.length}</span>
            <span>Flagged: {totalFlags}</span>
            <span>Passed: {passedReviews.length}</span>
            <span>Reviewed: {reviewedCount}</span>
            <span>Confirmed: {dataset.flags.filter((f) => f.confirmed === true).length}</span>
            <span>Rejected: {dataset.flags.filter((f) => f.confirmed === false).length}</span>
          </div>
          <div className="flex gap-1 p-0.5 rounded-md border bg-muted/30">
            {(['flagged', 'passed', 'all'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => { setViewMode(mode); setShowCount(20) }}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${
                  viewMode === mode ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {mode === 'flagged' ? `Flagged (${totalFlags})` : mode === 'passed' ? `Passed (${passedReviews.length})` : `All (${dataset.reviews.length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk actions */}
        {totalFlags > 0 && viewMode === 'flagged' && (
          <div className="flex items-center gap-2">
            {remainingCount > 0 && (
              <>
                <Button size="sm" variant="default" onClick={handleConfirmAll}>
                  <Check className="h-3 w-3 mr-1" />
                  Confirm All ({remainingCount})
                </Button>
                <Button size="sm" variant="outline" onClick={handleRejectAll}>
                  <X className="h-3 w-3 mr-1" />
                  Reject All ({remainingCount})
                </Button>
              </>
            )}
            {reviewedCount > 0 && (
              <Button size="sm" variant="ghost" onClick={handleResetAll}>
                <Undo2 className="h-3 w-3 mr-1" />
                Reset All
              </Button>
            )}
          </div>
        )}

        {/* Queue card — only in Flagged view */}
        {viewMode === 'flagged' && (
          <>
            {!allDone && currentFlag ? (
              <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    {remainingCount} of {totalFlags} remaining
                  </span>
                  <Button variant="ghost" size="sm" onClick={handleUndo} disabled={reviewedCount === 0}>
                    <Undo2 className="h-3 w-3 mr-1" />
                    Undo
                  </Button>
                </div>
                <div className="space-y-2">
                  <p className="text-sm leading-relaxed">
                    <HighlightedText text={getReviewText(currentFlag.reviewIndex)} highlights={currentFlag.highlights || []} />
                  </p>
                  <div className={`rounded px-3 py-2 ${currentFlag.flagType === 'vague_review' ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-yellow-500/10 border border-yellow-500/20'}`}>
                    <p className={`text-xs ${currentFlag.flagType === 'vague_review' ? 'text-purple-600 dark:text-purple-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                      <span className="font-medium">{currentFlag.flagType === 'vague_review' ? 'Vague:' : 'Flag reason:'}</span> {currentFlag.reason}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="default" onClick={handleConfirm} className="flex-1">
                    <Check className="h-4 w-4 mr-1" /> Confirm Error
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleReject} className="flex-1">
                    <X className="h-4 w-4 mr-1" /> Reject Flag
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
          </>
        )}

        {/* Review list */}
        <div className="space-y-2">
          {visibleReviews.map((review) => (
            <div
              key={`review-${review.index}`}
              className={`border rounded px-3 py-2 text-xs ${
                review.flag
                  ? review.flag.confirmed === true
                    ? 'border-red-500/30 bg-red-500/5'
                    : review.flag.confirmed === false
                      ? 'border-muted bg-muted/30 opacity-60'
                      : review.flag.flagType === 'vague_review'
                        ? 'border-purple-500/30 bg-purple-500/5'
                        : 'border-yellow-500/30 bg-yellow-500/5'
                  : 'border-green-500/20 bg-green-500/5'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">Review #{review.index}</span>
                {review.flag ? (
                  <>
                    {review.flag.confirmed === true && <Badge variant="destructive" className="text-[10px]">Confirmed Error</Badge>}
                    {review.flag.confirmed === false && <Badge variant="secondary" className="text-[10px]">Rejected</Badge>}
                    {review.flag.confirmed === null && <Badge variant="outline" className="text-[10px]">Pending</Badge>}
                  </>
                ) : (
                  <Badge className="text-[10px] bg-green-500/15 text-green-600 border-green-500/20">Passed</Badge>
                )}
              </div>
              <p className="text-muted-foreground">
                {review.flag && review.flag.highlights?.length > 0
                  ? <HighlightedText text={review.text} highlights={review.flag.highlights} />
                  : review.text
                }
              </p>
              {review.flag && (
                <p className={`italic mt-1 ${review.flag.flagType === 'vague_review' ? 'text-purple-600 dark:text-purple-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                  <span className="font-medium">
                    {review.flag.flagType === 'vague_review' ? 'Vague:' : 'Reason:'}
                  </span> {review.flag.reason}
                </p>
              )}
            </div>
          ))}

          {hasMore && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowCount((prev) => prev + 20)}
            >
              Show more ({displayedReviews.length - showCount} remaining)
            </Button>
          )}

          {displayedReviews.length === 0 && (
            <p className="text-center py-4 text-sm text-muted-foreground">
              No reviews in this view.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
