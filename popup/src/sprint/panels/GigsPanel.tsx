import { Target } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import type { GigStatus, GigTrack, SubStatus } from '../types'
import type { UseSprintStoreReturn } from '../useSprintStore'
import { gigCompletion } from '../utils'
import { GigStatusBadge, MetricCard, SubStatusBadge } from '../components'

interface GigsPanelProps {
  gigs: GigTrack[]
  updateGig: UseSprintStoreReturn['updateGig']
}

const gigStatuses: GigStatus[] = ['not_started', 'in_progress', 'review', 'live', 'paused']
const subStatuses: SubStatus[] = ['not_started', 'in_progress', 'done', 'needs_revision']
const subStatusFields: Array<{ key: keyof Pick<GigTrack, 'thumbnailStatus' | 'descriptionStatus' | 'packagesStatus' | 'faqStatus' | 'galleryStatus' | 'videoStatus'>; label: string }> = [
  { key: 'thumbnailStatus', label: 'Thumbnail' },
  { key: 'descriptionStatus', label: 'Description' },
  { key: 'packagesStatus', label: 'Packages' },
  { key: 'faqStatus', label: 'FAQ' },
  { key: 'galleryStatus', label: 'Gallery' },
  { key: 'videoStatus', label: 'Video' },
]
const rebuildSteps = ['Title rewritten', 'Description outcome-led', 'Packages clear', 'FAQ objections handled', 'Gallery proof added', 'Video or GIF ready']

function Textarea({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <textarea
      className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}

export function GigsPanel({ gigs, updateGig }: GigsPanelProps) {
  const readiness = gigs.length ? Math.round(gigs.reduce((sum, gig) => sum + gigCompletion(gig), 0) / gigs.length) : 0

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard label="Money Lanes" value={gigs.length} sub="Primary gig tracks" icon={Target} />
        <MetricCard label="Overall Readiness" value={`${readiness}%`} sub="Average sub-status progress" icon={Target} accent="primary" />
        <MetricCard label="Live / Review" value={gigs.filter((gig) => gig.status === 'live' || gig.status === 'review').length} sub="Ready for traffic" icon={Target} accent="green" />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {gigs.map((gig) => {
          const completion = gigCompletion(gig)

          return (
            <Card key={gig.id} className="overflow-hidden">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Badge variant="outline" className="mb-2">{gig.lane}</Badge>
                    <CardTitle className="text-base leading-snug">{gig.gigTitle}</CardTitle>
                  </div>
                  <GigStatusBadge status={gig.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-4 pt-2">
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Readiness</span>
                    <span className="font-medium">{completion}%</span>
                  </div>
                  <Progress value={completion} className="h-2" />
                </div>

                <select
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={gig.status}
                  onChange={(event) => updateGig(gig.id, { status: event.target.value as GigStatus, lastUpdated: new Date().toISOString() })}
                >
                  {gigStatuses.map((status) => <option key={status} value={status}>{status.replace('_', ' ')}</option>)}
                </select>

                <div className="space-y-2">
                  {subStatusFields.map((field) => (
                    <div key={field.key} className="flex items-center justify-between gap-2 rounded-lg border p-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{field.label}</span>
                        <SubStatusBadge status={gig[field.key]} />
                      </div>
                      <select
                        className="h-8 rounded-md border bg-background px-2 text-xs"
                        value={gig[field.key]}
                        onChange={(event) => updateGig(gig.id, { [field.key]: event.target.value as SubStatus, lastUpdated: new Date().toISOString() })}
                      >
                        {subStatuses.map((status) => <option key={status} value={status}>{status.replace('_', ' ')}</option>)}
                      </select>
                    </div>
                  ))}
                </div>

                <Input value={gig.seoKeywords} placeholder="SEO keywords" onChange={(event) => updateGig(gig.id, { seoKeywords: event.target.value })} />
                <Textarea value={gig.nextAction} placeholder="Next action" onChange={(value) => updateGig(gig.id, { nextAction: value })} />
                <Textarea value={gig.notes} placeholder="Notes" onChange={(value) => updateGig(gig.id, { notes: value })} />

                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Rebuild Checklist</p>
                  <div className="space-y-1.5">
                    {rebuildSteps.map((step, index) => (
                      <label key={step} className="flex items-center gap-2 text-xs">
                        <input type="checkbox" checked={index < Math.round((completion / 100) * rebuildSteps.length)} readOnly />
                        {step}
                      </label>
                    ))}
                  </div>
                </div>

                <Button variant="outline" size="sm" className="w-full" onClick={() => updateGig(gig.id, { readinessScore: completion, lastUpdated: new Date().toISOString() })}>
                  Save readiness snapshot
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
