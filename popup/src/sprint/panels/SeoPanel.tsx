import { useMemo, useState } from 'react'
import { Search, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import type { SeoIntent, SeoKeyword } from '../types'
import type { UseSprintStoreReturn } from '../useSprintStore'
import { EmptyState, MetricCard } from '../components'

interface SeoPanelProps {
  keywords: SeoKeyword[]
  upsertSeoKeyword: UseSprintStoreReturn['upsertSeoKeyword']
  deleteSeoKeyword: UseSprintStoreReturn['deleteSeoKeyword']
}

const emptyForm: Omit<SeoKeyword, 'id'> = {
  keyword: '',
  gigId: '',
  gigLane: '',
  intent: 'primary',
  difficulty: 3,
  status: 'research',
  usedInTitle: false,
  usedInTags: false,
  usedInDescription: false,
  notes: '',
}

export function SeoPanel({ keywords, upsertSeoKeyword, deleteSeoKeyword }: SeoPanelProps) {
  const [form, setForm] = useState(emptyForm)

  const coverage = useMemo(() => {
    const withTitle = keywords.filter((k) => k.usedInTitle).length
    const withTags = keywords.filter((k) => k.usedInTags).length
    const withDesc = keywords.filter((k) => k.usedInDescription).length
    const money = keywords.filter((k) => k.intent === 'transactional' || k.intent === 'commercial' || k.intent === 'primary').length
    return {
      withTitle,
      withTags,
      withDesc,
      money,
      pct: keywords.length ? Math.round(((withTitle + withTags + withDesc) / (keywords.length * 3)) * 100) : 0,
    }
  }, [keywords])

  const save = async () => {
    if (!form.keyword.trim()) return
    await upsertSeoKeyword(form)
    setForm(emptyForm)
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Keywords" value={keywords.length} icon={Search} />
        <MetricCard label="Coverage" value={`${coverage.pct}%`} sub="title/tags/desc usage" accent="green" />
        <MetricCard label="Money Intent" value={coverage.money} accent="amber" />
        <MetricCard label="In Title" value={coverage.withTitle} accent="blue" />
      </div>

      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base">Add Keyword</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 p-4 pt-2 md:grid-cols-2 xl:grid-cols-4">
          <Input placeholder="Keyword" value={form.keyword} onChange={(e) => setForm((p) => ({ ...p, keyword: e.target.value }))} />
          <Input placeholder="Gig lane" value={form.gigLane ?? ''} onChange={(e) => setForm((p) => ({ ...p, gigLane: e.target.value }))} />
          <select className="h-10 rounded-md border bg-background px-3 text-sm" value={form.intent} onChange={(e) => setForm((p) => ({ ...p, intent: e.target.value as SeoIntent }))}>
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
            <option value="longtail">Long-tail</option>
            <option value="transactional">Transactional</option>
            <option value="commercial">Commercial</option>
          </select>
          <Input type="number" min={1} max={5} placeholder="Difficulty 1-5" value={form.difficulty ?? 3} onChange={(e) => setForm((p) => ({ ...p, difficulty: Number(e.target.value) || 3 }))} />
          <Textarea className="md:col-span-2 xl:col-span-3" placeholder="Notes" value={form.notes ?? ''} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
          <Button onClick={save}>Add Keyword</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base">Keyword Coverage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 p-4 pt-2">
          <Progress value={coverage.pct} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Title {coverage.withTitle} · Tags {coverage.withTags} · Description {coverage.withDesc}
          </p>
        </CardContent>
      </Card>

      {keywords.length === 0 ? (
        <EmptyState title="No SEO keywords yet" desc="Track primary and long-tail keywords for each money lane." />
      ) : (
        <div className="space-y-3">
          {keywords.map((kw) => (
            <Card key={kw.id}>
              <CardContent className="space-y-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{kw.keyword}</p>
                    <p className="text-xs text-muted-foreground">{kw.gigLane || kw.gigId || 'No gig lane'} · difficulty {kw.difficulty ?? '—'}/5</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">{kw.intent}</Badge>
                    <Badge variant="outline" className="capitalize">{kw.status}</Badge>
                    <Button size="icon" variant="ghost" onClick={() => deleteSeoKeyword(kw.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant={kw.usedInTitle ? 'default' : 'outline'} onClick={() => upsertSeoKeyword({ ...kw, usedInTitle: !kw.usedInTitle })}>
                    Title
                  </Button>
                  <Button size="sm" variant={kw.usedInTags ? 'default' : 'outline'} onClick={() => upsertSeoKeyword({ ...kw, usedInTags: !kw.usedInTags })}>
                    Tags
                  </Button>
                  <Button size="sm" variant={kw.usedInDescription ? 'default' : 'outline'} onClick={() => upsertSeoKeyword({ ...kw, usedInDescription: !kw.usedInDescription })}>
                    Description
                  </Button>
                </div>
                {kw.notes && <p className="text-xs text-muted-foreground">{kw.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
