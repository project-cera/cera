import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FlaskConical, Microscope } from 'lucide-react'
import { RQ_DEFINITIONS, INSTRUMENT_DEFINITIONS } from './types'

interface RqSelectorProps {
  onSelect: (id: string) => void
}

export function RqSelector({ onSelect }: RqSelectorProps) {
  return (
    <div className="space-y-6">
      {/* Research Questions */}
      <div className="grid gap-4 sm:grid-cols-2">
        {RQ_DEFINITIONS.map((rq) => (
          <Card
            key={rq.id}
            className="cursor-pointer transition-colors hover:bg-muted/50"
            onClick={() => onSelect(rq.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">{rq.title}</CardTitle>
              </div>
              <CardDescription>{rq.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {rq.tables.map((table) => (
                  <Badge key={table.id} variant="secondary" className="text-xs">
                    {table.id}: {table.label}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Research Instruments */}
      {INSTRUMENT_DEFINITIONS.length > 0 && (
        <>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Research Instruments
            </h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {INSTRUMENT_DEFINITIONS.map((instrument) => (
              <Card
                key={instrument.id}
                className="cursor-pointer transition-colors hover:bg-muted/50"
                onClick={() => onSelect(instrument.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Microscope className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-base">{instrument.title}</CardTitle>
                  </div>
                  <CardDescription>{instrument.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {instrument.badges.map((badge) => (
                      <Badge key={badge} variant="secondary" className="text-xs">
                        {badge}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
