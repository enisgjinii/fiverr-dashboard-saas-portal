import { useMemo, useState } from 'react'
import { Trash2, TrendingUp } from 'lucide-react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { AnalyticsEntry } from '../types'
import type { UseSprintStoreReturn } from '../useSprintStore'
import { analyticsDelta, computeCtr, computeMsgRate, computeOrderRate, getTodayKey } from '../utils'
import { EmptyState, MetricCard } from '../components'

interface AnalyticsPanelProps {
  entries: AnalyticsEntry[]
  addAnalytics: UseSprintStoreReturn['addAnalytics']
  deleteAnalytics: UseSprintStoreReturn['deleteAnalytics']
}

type AnalyticsForm = Omit<AnalyticsEntry, 'id'>

const emptyForm = (): AnalyticsForm => ({
  date: getTodayKey(),
  impressions: 0,
  clicks: 0,
  messages: 0,
  orders: 0,
  conversionRate: 0,
  bestGig: '',
  worstGig: '',
  changesMadeToday: '',
  notes: '',
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

const numberValue = (value?: number) => (value == null ? '—' : value.toLocaleString())

export function AnalyticsPanel({ entries, addAnalytics, deleteAnalytics }: AnalyticsPanelProps) {
  const [form, setForm] = useState<AnalyticsForm>(() => emptyForm())
  const baseline = entries.find((entry) => entry.isBaseline) ?? entries[entries.length - 1]
  const latest = entries.find((entry) => !entry.isBaseline) ?? entries[0]
  const delta = analyticsDelta(latest, baseline)
  const trend = useMemo(
    () =>
      [...entries]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((entry) => ({
          date: entry.date.slice(5),
          impressions: entry.impressions ?? 0,
          clicks: entry.clicks ?? 0,
          messages: entry.messages ?? 0,
          orders: entry.orders ?? 0,
        })),
    [entries]
  )

  const updateNumber = (key: keyof Pick<AnalyticsForm, 'impressions' | 'clicks' | 'messages' | 'orders' | 'conversionRate'>, value: string) => {
    setForm((current) => ({ ...current, [key]: value === '' ? undefined : Number(value) }))
  }

  const handleSubmit = async () => {
    const draftEntry: AnalyticsEntry = { ...form, id: 'draft' }
    await addAnalytics({
      ...form,
      clickThroughRate: computeCtr(draftEntry) ?? undefined,
      responseRate: computeMsgRate(draftEntry) ?? undefined,
      conversionRate: form.conversionRate || computeOrderRate(draftEntry) || undefined,
    })
    setForm(emptyForm())
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Impressions Δ" value={delta?.impressions.delta ?? 0} sub={`Baseline ${numberValue(delta?.impressions.baseline)}`} icon={TrendingUp} accent="blue" />
        <MetricCard label="Clicks Δ" value={delta?.clicks.delta ?? 0} sub={`Baseline ${numberValue(delta?.clicks.baseline)}`} icon={TrendingUp} accent="primary" />
        <MetricCard label="Messages Δ" value={delta?.messages.delta ?? 0} sub={`Baseline ${numberValue(delta?.messages.baseline)}`} icon={TrendingUp} accent="amber" />
        <MetricCard label="Orders Δ" value={delta?.orders.delta ?? 0} sub={`Baseline ${numberValue(delta?.orders.baseline)}`} icon={TrendingUp} accent="green" />
      </div>

      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base">Add Analytics Entry</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-2">
          <div className="grid gap-3 md:grid-cols-5">
            <Input type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} />
            <Input type="number" value={form.impressions ?? ''} placeholder="Impressions" onChange={(event) => updateNumber('impressions', event.target.value)} />
            <Input type="number" value={form.clicks ?? ''} placeholder="Clicks" onChange={(event) => updateNumber('clicks', event.target.value)} />
            <Input type="number" value={form.messages ?? ''} placeholder="Messages" onChange={(event) => updateNumber('messages', event.target.value)} />
            <Input type="number" value={form.orders ?? ''} placeholder="Orders" onChange={(event) => updateNumber('orders', event.target.value)} />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <Input value={form.bestGig} placeholder="Best gig" onChange={(event) => setForm((current) => ({ ...current, bestGig: event.target.value }))} />
            <Input value={form.worstGig} placeholder="Worst gig" onChange={(event) => setForm((current) => ({ ...current, worstGig: event.target.value }))} />
            <Input type="number" value={form.conversionRate ?? ''} placeholder="Conversion %" onChange={(event) => updateNumber('conversionRate', event.target.value)} />
          </div>
          <Textarea value={form.changesMadeToday} placeholder="Changes made today" onChange={(value) => setForm((current) => ({ ...current, changesMadeToday: value }))} />
          <Textarea value={form.notes} placeholder="Notes" onChange={(value) => setForm((current) => ({ ...current, notes: value }))} />
          <Button onClick={handleSubmit}>Add Entry</Button>
        </CardContent>
      </Card>

      {baseline && (
        <Card className="border-primary/20">
          <CardContent className="grid gap-3 p-4 md:grid-cols-5">
            <div>
              <p className="text-xs text-muted-foreground">Baseline</p>
              <p className="font-semibold">{baseline.date}</p>
            </div>
            <div><p className="text-xs text-muted-foreground">Impressions</p><p className="font-semibold">{numberValue(baseline.impressions)}</p></div>
            <div><p className="text-xs text-muted-foreground">Clicks</p><p className="font-semibold">{numberValue(baseline.clicks)}</p></div>
            <div><p className="text-xs text-muted-foreground">Messages</p><p className="font-semibold">{numberValue(baseline.messages)}</p></div>
            <div><p className="text-xs text-muted-foreground">Orders</p><p className="font-semibold">{numberValue(baseline.orders)}</p></div>
          </CardContent>
        </Card>
      )}

      {trend.length > 1 && (
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-64 p-4 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="impressions" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="clicks" stroke="#22c55e" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="messages" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base">Entries</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          {entries.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Impr.</TableHead>
                  <TableHead>Clicks</TableHead>
                  <TableHead>Msgs</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.date}{entry.isBaseline ? ' · baseline' : ''}</TableCell>
                    <TableCell>{numberValue(entry.impressions)}</TableCell>
                    <TableCell>{numberValue(entry.clicks)}</TableCell>
                    <TableCell>{numberValue(entry.messages)}</TableCell>
                    <TableCell>{numberValue(entry.orders)}</TableCell>
                    <TableCell className="max-w-xs truncate">{entry.notes || entry.changesMadeToday}</TableCell>
                    <TableCell className="text-right">
                      {!entry.isBaseline && (
                        <Button variant="ghost" size="sm" onClick={() => deleteAnalytics(entry.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState title="No analytics yet" desc="Add the Fiverr baseline first." />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
