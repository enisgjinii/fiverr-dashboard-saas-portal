import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { WeeklyReview } from '../types'
import type { UseSprintStoreReturn } from '../useSprintStore'
import { endOfWeek, getTodayKey, startOfWeek } from '../utils'
import { EmptyState } from '../components'

interface WeeklyPanelProps {
  weeklyReviews: WeeklyReview[]
  upsertWeeklyReview: UseSprintStoreReturn['upsertWeeklyReview']
  deleteWeeklyReview: UseSprintStoreReturn['deleteWeeklyReview']
}

type WeeklyForm = Partial<WeeklyReview> & { weekStart: string }

const emptyReview = (): WeeklyForm => ({
  weekStart: startOfWeek(getTodayKey()),
  weekEnd: endOfWeek(getTodayKey()),
  improved: '',
  gotClicks: '',
  blocked: '',
  fixNextWeek: '',
  proofCreated: '',
  focusNextWeek: '',
  wins: '',
  metricsSnapshot: '',
  energyScore: 5,
})

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

export function WeeklyPanel({ weeklyReviews, upsertWeeklyReview, deleteWeeklyReview }: WeeklyPanelProps) {
  const [form, setForm] = useState<WeeklyForm>(() => emptyReview())

  const handleSubmit = async () => {
    await upsertWeeklyReview(form)
    setForm(emptyReview())
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base">Weekly Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-2">
          <div className="grid gap-3 md:grid-cols-3">
            <Input type="date" value={form.weekStart} onChange={(event) => setForm((current) => ({ ...current, weekStart: event.target.value }))} />
            <Input type="date" value={form.weekEnd ?? ''} onChange={(event) => setForm((current) => ({ ...current, weekEnd: event.target.value }))} />
            <Input type="number" min={1} max={10} value={form.energyScore ?? 5} onChange={(event) => setForm((current) => ({ ...current, energyScore: Number(event.target.value) }))} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Textarea value={form.improved ?? ''} placeholder="What improved?" onChange={(value) => setForm((current) => ({ ...current, improved: value }))} />
            <Textarea value={form.gotClicks ?? ''} placeholder="What got clicks/messages?" onChange={(value) => setForm((current) => ({ ...current, gotClicks: value }))} />
            <Textarea value={form.blocked ?? ''} placeholder="What blocked progress?" onChange={(value) => setForm((current) => ({ ...current, blocked: value }))} />
            <Textarea value={form.fixNextWeek ?? ''} placeholder="What to fix next week?" onChange={(value) => setForm((current) => ({ ...current, fixNextWeek: value }))} />
            <Textarea value={form.proofCreated ?? ''} placeholder="Proof created" onChange={(value) => setForm((current) => ({ ...current, proofCreated: value }))} />
            <Textarea value={form.focusNextWeek ?? ''} placeholder="Focus next week" onChange={(value) => setForm((current) => ({ ...current, focusNextWeek: value }))} />
            <Textarea value={form.wins ?? ''} placeholder="Wins" onChange={(value) => setForm((current) => ({ ...current, wins: value }))} />
            <Textarea value={form.metricsSnapshot ?? ''} placeholder="Metrics snapshot" onChange={(value) => setForm((current) => ({ ...current, metricsSnapshot: value }))} />
          </div>
          <Button onClick={handleSubmit}>Save Weekly Review</Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {weeklyReviews.length ? weeklyReviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base">{review.weekStart} {review.weekEnd ? `to ${review.weekEnd}` : ''}</CardTitle>
                    <Badge variant="outline">Energy {review.energyScore ?? '—'}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{review.createdAt.slice(0, 10)}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => deleteWeeklyReview(review.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-3 text-sm md:grid-cols-2">
                <p><span className="font-medium">Improved:</span> {review.improved || '—'}</p>
                <p><span className="font-medium">Clicks:</span> {review.gotClicks || '—'}</p>
                <p><span className="font-medium">Blocked:</span> {review.blocked || '—'}</p>
                <p><span className="font-medium">Next fix:</span> {review.fixNextWeek || '—'}</p>
                <p><span className="font-medium">Proof:</span> {review.proofCreated || '—'}</p>
                <p><span className="font-medium">Next focus:</span> {review.focusNextWeek || '—'}</p>
              </div>
            </CardContent>
          </Card>
        )) : <Card><EmptyState title="No weekly reviews yet" desc="Capture the first review at the end of this week." /></Card>}
      </div>
    </div>
  )
}
