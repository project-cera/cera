import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'
import { Button } from '../components/ui/button'
import { RqSelector } from '../components/research-tools/rq-selector'
import { Rq1Page } from '../components/research-tools/rq1/rq1-page'
import { Rq2Skeleton } from '../components/research-tools/rq2-skeleton'
import { Rq3Skeleton } from '../components/research-tools/rq3-skeleton'
import { Rq4Skeleton } from '../components/research-tools/rq4-skeleton'
import { AblationSilPage } from '../components/research-tools/ablation-sil/ablation-sil-page'
import { RQ_DEFINITIONS, INSTRUMENT_DEFINITIONS } from '../components/research-tools/types'
import { z } from 'zod'

const toolValues = ['rq1', 'rq2', 'rq3', 'rq4', 'ablation-sil'] as const

const searchSchema = z.object({
  rq: z.enum(toolValues).optional(),
  table: z.string().optional(),
})

export const Route = createFileRoute('/research-tools')({
  component: ResearchToolsPage,
  validateSearch: searchSchema,
})

function ResearchToolsPage() {
  const navigate = useNavigate()
  const { rq: selectedTool, table: selectedTable } = useSearch({ from: '/research-tools' })

  const handleSelect = (id: string) => {
    navigate({ to: '/research-tools', search: { rq: id as typeof toolValues[number], table: undefined } })
  }

  const handleBack = () => {
    navigate({ to: '/research-tools', search: { rq: undefined, table: undefined } })
  }

  const handleTableChange = (table: string) => {
    navigate({ to: '/research-tools', search: { rq: selectedTool, table }, replace: true })
  }

  // Find definition for selected tool (either RQ or instrument)
  const rqDef = selectedTool ? RQ_DEFINITIONS.find(r => r.id === selectedTool) : null
  const instrumentDef = selectedTool ? INSTRUMENT_DEFINITIONS.find(i => i.id === selectedTool) : null
  const toolTitle = rqDef?.title || instrumentDef?.title
  const toolDescription = rqDef?.description || instrumentDef?.description

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Research Tools</h1>
        <p className="text-muted-foreground">
          Generate paper-ready tables for thesis research questions
        </p>
      </div>

      {selectedTool ? (
        <div className="space-y-4">
          {/* Back button + tool title */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            {(toolTitle) && (
              <div>
                <h2 className="text-lg font-semibold">{toolTitle}</h2>
                <p className="text-sm text-muted-foreground">{toolDescription}</p>
              </div>
            )}
          </div>

          {/* Tool content */}
          {selectedTool === 'rq1' && (
            <Rq1Page
              currentTable={selectedTable || '1a'}
              onTableChange={handleTableChange}
            />
          )}
          {selectedTool === 'rq2' && <Rq2Skeleton />}
          {selectedTool === 'rq3' && <Rq3Skeleton />}
          {selectedTool === 'rq4' && <Rq4Skeleton />}
          {selectedTool === 'ablation-sil' && <AblationSilPage />}
        </div>
      ) : (
        <RqSelector onSelect={handleSelect} />
      )}
    </div>
  )
}
