import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { PYTHON_API_URL } from '@/lib/api-urls'
import type { AblationDataset, FlaggedReview } from '../types'
import { ABLATION_MODE_LABELS, ABLATION_DOMAIN_LABELS } from '../types'

interface FlaggingProgressProps {
  factsheet: string
  modelId: string
  datasets: AblationDataset[]
  onComplete: (datasets: AblationDataset[]) => void
}

interface DatasetProgress {
  status: 'pending' | 'running' | 'done' | 'error'
  flagCount: number
  error?: string
}

export function FlaggingProgress({
  factsheet,
  modelId,
  datasets,
  onComplete,
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

    async function runAll() {
      for (let i = 0; i < datasets.length; i++) {
        const ds = datasets[i]
        setProgress((prev) => ({
          ...prev,
          [ds.id]: { status: 'running', flagCount: 0 },
        }))

        try {
          const res = await fetch(`${PYTHON_API_URL}/api/flag-reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              factsheet,
              reviews: ds.reviews,
              model_id: modelId,
              batch_size: 25,
            }),
          })

          if (!res.ok) {
            const errText = await res.text()
            throw new Error(errText || `HTTP ${res.status}`)
          }

          const data = await res.json()
          const flags: FlaggedReview[] = (data.flags || []).map(
            (f: { review_index: number; reason: string }) => ({
              reviewIndex: f.review_index,
              reason: f.reason,
              confirmed: null,
            }),
          )

          resultsRef.current = resultsRef.current.map((d) =>
            d.id === ds.id
              ? { ...d, flags, flaggingComplete: true }
              : d,
          )

          setProgress((prev) => ({
            ...prev,
            [ds.id]: { status: 'done', flagCount: flags.length },
          }))
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error'
          setProgress((prev) => ({
            ...prev,
            [ds.id]: { status: 'error', flagCount: 0, error: message },
          }))

          resultsRef.current = resultsRef.current.map((d) =>
            d.id === ds.id ? { ...d, flaggingComplete: true } : d,
          )
        }
      }

      onComplete(resultsRef.current)
    }

    runAll()
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
          <CardTitle className="text-base">Flagging Progress</CardTitle>
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
                      <Badge className="text-xs bg-green-500/15 text-green-500 border-green-500/20">
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
