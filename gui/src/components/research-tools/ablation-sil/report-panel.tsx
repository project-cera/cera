import { useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Download } from 'lucide-react'
import type { AblationDataset, AblationDomain, AblationMode } from '../types'
import { ABLATION_MODE_LABELS, ABLATION_DOMAIN_LABELS } from '../types'

interface ReportPanelProps {
  datasets: AblationDataset[]
}

interface ModeStats {
  totalReviews: number
  flaggedCount: number
  confirmedErrors: number
  rejectedFlags: number
  errorRate: string
}

function computeStats(datasets: AblationDataset[]): ModeStats {
  const totalReviews = datasets.reduce((sum, ds) => sum + ds.reviews.length, 0)
  const flaggedCount = datasets.reduce((sum, ds) => sum + ds.flags.length, 0)
  const confirmedErrors = datasets.reduce(
    (sum, ds) => sum + ds.flags.filter((f) => f.confirmed === true).length,
    0,
  )
  const rejectedFlags = datasets.reduce(
    (sum, ds) => sum + ds.flags.filter((f) => f.confirmed === false).length,
    0,
  )
  const errorRate =
    totalReviews > 0
      ? ((confirmedErrors / totalReviews) * 100).toFixed(2)
      : '0.00'

  return { totalReviews, flaggedCount, confirmedErrors, rejectedFlags, errorRate }
}

export function ReportPanel({ datasets }: ReportPanelProps) {
  const modes = useMemo(() => {
    const modeSet = new Set(datasets.map((ds) => ds.mode))
    return Array.from(modeSet) as AblationMode[]
  }, [datasets])

  const domains = useMemo(() => {
    const domainSet = new Set(datasets.map((ds) => ds.domain))
    return Array.from(domainSet) as AblationDomain[]
  }, [datasets])

  // Overall stats per mode
  const overallStats = useMemo(() => {
    const result: Record<string, ModeStats> = {}
    for (const mode of modes) {
      result[mode] = computeStats(datasets.filter((ds) => ds.mode === mode))
    }
    return result
  }, [datasets, modes])

  // Per-domain stats
  const domainStats = useMemo(() => {
    const result: Record<string, Record<string, ModeStats>> = {}
    for (const domain of domains) {
      result[domain] = {}
      for (const mode of modes) {
        result[domain][mode] = computeStats(
          datasets.filter((ds) => ds.domain === domain && ds.mode === mode),
        )
      }
    }
    return result
  }, [datasets, modes, domains])

  const metricRows = [
    { key: 'totalReviews', label: 'Total Reviews' },
    { key: 'flaggedCount', label: 'Flagged Count' },
    { key: 'confirmedErrors', label: 'Confirmed Errors' },
    { key: 'rejectedFlags', label: 'Rejected Flags' },
    { key: 'errorRate', label: 'Error Rate (%)' },
  ] as const

  const exportCsv = useCallback(() => {
    const header = ['Metric', ...modes.map((m) => ABLATION_MODE_LABELS[m])]
    const rows = metricRows.map((row) => [
      row.label,
      ...modes.map((m) => String(overallStats[m][row.key])),
    ])

    // Add domain breakdowns
    for (const domain of domains) {
      rows.push([]) // blank line
      rows.push([`--- ${ABLATION_DOMAIN_LABELS[domain]} ---`])
      for (const row of metricRows) {
        rows.push([
          `${ABLATION_DOMAIN_LABELS[domain]}: ${row.label}`,
          ...modes.map((m) => String(domainStats[domain]?.[m]?.[row.key] ?? '')),
        ])
      }
    }

    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n')
    downloadFile(csv, 'ablation-sil-report.csv', 'text/csv')
  }, [modes, domains, overallStats, domainStats])

  const exportJson = useCallback(() => {
    const report = {
      overall: Object.fromEntries(
        modes.map((m) => [m, overallStats[m]]),
      ),
      perDomain: Object.fromEntries(
        domains.map((d) => [
          d,
          Object.fromEntries(
            modes.map((m) => [m, domainStats[d]?.[m] ?? null]),
          ),
        ]),
      ),
      datasets: datasets.map((ds) => ({
        fileName: ds.fileName,
        mode: ds.mode,
        domain: ds.domain,
        size: ds.size,
        totalFlags: ds.flags.length,
        confirmedErrors: ds.flags.filter((f) => f.confirmed === true).length,
        rejectedFlags: ds.flags.filter((f) => f.confirmed === false).length,
        flags: ds.flags,
      })),
    }
    downloadFile(
      JSON.stringify(report, null, 2),
      'ablation-sil-report.json',
      'application/json',
    )
  }, [modes, domains, overallStats, domainStats, datasets])

  return (
    <div className="space-y-6">
      {/* Summary Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Summary</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportCsv}>
                <Download className="h-4 w-4 mr-1" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={exportJson}>
                <Download className="h-4 w-4 mr-1" />
                JSON
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                {modes.map((mode) => (
                  <TableHead key={mode} className="text-right">
                    {ABLATION_MODE_LABELS[mode]}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {metricRows.map((row) => (
                <TableRow key={row.key}>
                  <TableCell className="font-medium">{row.label}</TableCell>
                  {modes.map((mode) => (
                    <TableCell key={mode} className="text-right tabular-nums">
                      {overallStats[mode][row.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Per-domain breakdown */}
      {domains.map((domain) => (
        <Card key={domain}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {ABLATION_DOMAIN_LABELS[domain]} Domain
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  {modes.map((mode) => (
                    <TableHead key={mode} className="text-right">
                      {ABLATION_MODE_LABELS[mode]}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {metricRows.map((row) => (
                  <TableRow key={row.key}>
                    <TableCell className="font-medium">{row.label}</TableCell>
                    {modes.map((mode) => (
                      <TableCell key={mode} className="text-right tabular-nums">
                        {domainStats[domain]?.[mode]?.[row.key] ?? '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
