import { useState } from 'react'
import { Plus, Search, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { CompetitorWatch } from '../types'
import type { UseSprintStoreReturn } from '../useSprintStore'
import { EmptyState, MetricCard } from '../components'

interface CompetitorsPanelProps {
  competitors: CompetitorWatch[]
  upsertCompetitor: UseSprintStoreReturn['upsertCompetitor']
  deleteCompetitor: UseSprintStoreReturn['deleteCompetitor']
}

const emptyForm: Omit<CompetitorWatch, 'id'> = {
  username: '',
  niche: '',
  strengths: '',
  weaknesses: '',
  priceRange: '',
  notes: '',
  rating: 0,
  reviews: 0,
  threatLevel: 'medium',
  thumbnailNotes: '',
  lastChecked: '',
}

export function CompetitorsPanel({ competitors, upsertCompetitor, deleteCompetitor }: CompetitorsPanelProps) {
  const [form, setForm] = useState(emptyForm)
  const highThreat = competitors.filter((c) => c.threatLevel === 'high').length

  const save = async () => {
    if (!form.username.trim()) return
    await upsertCompetitor(form)
    setForm(emptyForm)
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard label="Tracked" value={competitors.length} icon={Search} />
        <MetricCard label="High Threat" value={highThreat} accent="red" />
        <MetricCard label="Avg Rating" value={competitors.length ? (competitors.reduce((s, c) => s + (c.rating ?? 0), 0) / competitors.length).toFixed(1) : '—'} accent="amber" />
      </div>

      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base">Add Competitor Scan</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 p-4 pt-2 md:grid-cols-2">
          <Input placeholder="Fiverr username" value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} />
          <Input placeholder="Niche" value={form.niche} onChange={(e) => setForm((f) => ({ ...f, niche: e.target.value }))} />
          <Input placeholder="Price range" value={form.priceRange} onChange={(e) => setForm((f) => ({ ...f, priceRange: e.target.value }))} />
          <Input type="number" placeholder="Rating" value={form.rating ?? 0} onChange={(e) => setForm((f) => ({ ...f, rating: Number(e.target.value) }))} />
          <Input type="number" placeholder="Reviews" value={form.reviews ?? 0} onChange={(e) => setForm((f) => ({ ...f, reviews: Number(e.target.value) }))} />
          <select className="h-10 rounded-md border bg-background px-3 text-sm" value={form.threatLevel ?? 'medium'} onChange={(e) => setForm((f) => ({ ...f, threatLevel: e.target.value as CompetitorWatch['threatLevel'] }))}>
            <option value="low">Low threat</option>
            <option value="medium">Medium threat</option>
            <option value="high">High threat</option>
          </select>
          <Textarea className="md:col-span-2" placeholder="Strengths" value={form.strengths} onChange={(e) => setForm((f) => ({ ...f, strengths: e.target.value }))} />
          <Textarea className="md:col-span-2" placeholder="Weaknesses / gaps you can beat" value={form.weaknesses} onChange={(e) => setForm((f) => ({ ...f, weaknesses: e.target.value }))} />
          <Input className="md:col-span-2" placeholder="Thumbnail notes" value={form.thumbnailNotes ?? ''} onChange={(e) => setForm((f) => ({ ...f, thumbnailNotes: e.target.value }))} />
          <Textarea className="md:col-span-2" placeholder="Notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          <Button className="md:col-span-2" onClick={save}><Plus className="mr-2 h-4 w-4" />Save Scan</Button>
        </CardContent>
      </Card>

      {competitors.length === 0 ? (
        <EmptyState title="No competitors tracked" desc="Scan one competitor daily and log what you can beat." />
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {competitors.map((c) => (
            <Card key={c.id}>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">@{c.username}</p>
                    <p className="text-xs text-muted-foreground">{c.niche || 'No niche'} · {c.priceRange || 'No price'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">{c.threatLevel ?? 'medium'}</Badge>
                    <Button size="icon" variant="ghost" onClick={() => deleteCompetitor(c.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <p className="text-xs">⭐ {c.rating ?? 0} · {c.reviews ?? 0} reviews</p>
                {c.strengths && <p className="text-xs"><span className="font-medium">Strengths:</span> {c.strengths}</p>}
                {c.weaknesses && <p className="text-xs"><span className="font-medium">Weaknesses:</span> {c.weaknesses}</p>}
                {c.thumbnailNotes && <p className="text-xs text-muted-foreground">Thumbnails: {c.thumbnailNotes}</p>}
                {c.notes && <p className="text-xs text-muted-foreground">{c.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
