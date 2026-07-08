import { useMemo, useState } from 'react'
import { Copy, Trash2, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { BuyerLead, LeadStatus, LeadTemperature, MessageTemplate } from '../types'
import type { UseSprintStoreReturn } from '../useSprintStore'
import { getTodayKey, leadPipeline } from '../utils'
import { EmptyState, LeadStatusBadge, MetricCard } from '../components'

interface LeadsPanelProps {
  leads: BuyerLead[]
  templates: MessageTemplate[]
  upsertLead: UseSprintStoreReturn['upsertLead']
  deleteLead: UseSprintStoreReturn['deleteLead']
}

type LeadForm = Partial<BuyerLead> & { buyerName: string; fiverrUsername: string }

const statuses: LeadStatus[] = ['new', 'replied', 'waiting', 'warm', 'closed', 'lost']
const temperatures: LeadTemperature[] = ['cold', 'warm', 'hot']

const emptyLead = (): LeadForm => ({
  buyerName: '',
  fiverrUsername: '',
  projectType: '',
  budget: '',
  status: 'new',
  temperature: 'warm',
  nextFollowUpDate: getTodayKey(),
  notes: '',
  customOfferSent: false,
  orderCreated: false,
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

export function LeadsPanel({ leads, templates, upsertLead, deleteLead }: LeadsPanelProps) {
  const [form, setForm] = useState<LeadForm>(() => emptyLead())
  const today = getTodayKey()
  const pipeline = useMemo(() => leadPipeline(leads), [leads])
  const overdue = leads.filter((lead) => lead.nextFollowUpDate && lead.nextFollowUpDate <= today && !['closed', 'lost'].includes(lead.status))

  const handleSubmit = async () => {
    if (!form.buyerName.trim() || !form.fiverrUsername.trim()) return
    await upsertLead(form)
    setForm(emptyLead())
  }

  const copyTemplate = async (body: string) => {
    await navigator.clipboard?.writeText(body)
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Total Leads" value={leads.length} sub="Pipeline records" icon={Users} />
        <MetricCard label="Warm" value={leads.filter((lead) => lead.status === 'warm' || lead.temperature === 'warm' || lead.temperature === 'hot').length} sub="Worth follow-up" icon={Users} accent="amber" />
        <MetricCard label="Closed" value={leads.filter((lead) => lead.status === 'closed' || lead.orderCreated).length} sub="Orders created" icon={Users} accent="green" />
        <MetricCard label="Follow-ups Due" value={overdue.length} sub="Not closed/lost" icon={Users} accent={overdue.length ? 'red' : 'green'} />
      </div>

      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base">Add Lead</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-2">
          <div className="grid gap-3 md:grid-cols-4">
            <Input value={form.buyerName} placeholder="Buyer name" onChange={(event) => setForm((current) => ({ ...current, buyerName: event.target.value }))} />
            <Input value={form.fiverrUsername} placeholder="Fiverr username" onChange={(event) => setForm((current) => ({ ...current, fiverrUsername: event.target.value }))} />
            <Input value={form.projectType ?? ''} placeholder="Project type" onChange={(event) => setForm((current) => ({ ...current, projectType: event.target.value }))} />
            <Input value={form.budget ?? ''} placeholder="Budget" onChange={(event) => setForm((current) => ({ ...current, budget: event.target.value }))} />
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <select className="h-10 rounded-md border bg-background px-3 text-sm" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as LeadStatus }))}>
              {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <select className="h-10 rounded-md border bg-background px-3 text-sm" value={form.temperature} onChange={(event) => setForm((current) => ({ ...current, temperature: event.target.value as LeadTemperature }))}>
              {temperatures.map((temperature) => <option key={temperature} value={temperature}>{temperature}</option>)}
            </select>
            <Input type="date" value={form.nextFollowUpDate ?? ''} onChange={(event) => setForm((current) => ({ ...current, nextFollowUpDate: event.target.value }))} />
            <Button onClick={handleSubmit}>Add Lead</Button>
          </div>
          <Textarea value={form.notes ?? ''} placeholder="Notes" onChange={(value) => setForm((current) => ({ ...current, notes: value }))} />
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-6">
        {pipeline.map((column) => (
          <Card key={column.status}>
            <CardHeader className="p-3 pb-2">
              <div className="flex items-center justify-between">
                <LeadStatusBadge status={column.status} />
                <Badge variant="outline">{column.count}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 p-3 pt-1">
              {column.leads.length ? column.leads.map((lead) => {
                const due = lead.nextFollowUpDate && lead.nextFollowUpDate <= today && !['closed', 'lost'].includes(lead.status)

                return (
                  <div key={lead.id} className="rounded-lg border bg-background p-3">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{lead.buyerName}</p>
                        <p className="text-xs text-muted-foreground">@{lead.fiverrUsername}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => deleteLead(lead.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs">{lead.projectType || 'No project type'}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <Badge variant="outline">{lead.temperature}</Badge>
                      {lead.budget && <Badge variant="outline">{lead.budget}</Badge>}
                      {due && <Badge className="bg-red-500 text-white">Due</Badge>}
                    </div>
                    <select className="mt-3 h-8 w-full rounded-md border bg-background px-2 text-xs" value={lead.status} onChange={(event) => upsertLead({ ...lead, status: event.target.value as LeadStatus })}>
                      {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                    <div className="mt-2 grid gap-2 text-xs">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={lead.customOfferSent} onChange={(event) => upsertLead({ ...lead, customOfferSent: event.target.checked })} />
                        Custom offer sent
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={lead.orderCreated} onChange={(event) => upsertLead({ ...lead, orderCreated: event.target.checked, status: event.target.checked ? 'closed' : lead.status })} />
                        Order created
                      </label>
                    </div>
                  </div>
                )
              }) : <EmptyState title="Empty" desc="No leads in this stage." />}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base">Message Templates</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 p-4 pt-2 md:grid-cols-2">
          {templates.map((template) => (
            <div key={template.id} className="rounded-lg border p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{template.title}</p>
                  <Badge variant="outline" className="mt-1">{template.category}</Badge>
                </div>
                <Button variant="outline" size="sm" onClick={() => copyTemplate(template.body)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
              </div>
              <p className="whitespace-pre-wrap text-xs text-muted-foreground">{template.body}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
