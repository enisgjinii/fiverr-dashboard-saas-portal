import { useState } from 'react'
import { Save } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { SeptemberScalePlan } from '../types'
import type { UseSprintStoreReturn } from '../useSprintStore'

interface SeptemberPanelProps {
  plan: SeptemberScalePlan
  updateSeptemberPlan: UseSprintStoreReturn['updateSeptemberPlan']
}

function Textarea({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <textarea
      className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}

export function SeptemberPanel({ plan, updateSeptemberPlan }: SeptemberPanelProps) {
  const [draft, setDraft] = useState<SeptemberScalePlan>(plan)
  const completedMilestones = draft.milestones.filter((milestone) => milestone.done).length

  const save = () => updateSeptemberPlan(draft)

  return (
    <div className="space-y-5">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card">
        <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <Badge className="mb-2">September Scale</Badge>
            <h2 className="text-xl font-bold">Turn sprint assets into consistent buyer flow</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Last updated {new Date(plan.updatedAt).toLocaleDateString()}
            </p>
          </div>
          <Button onClick={save}>
            <Save className="mr-2 h-4 w-4" />
            Save Plan
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Scale Plan Fields</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 p-4 pt-2 md:grid-cols-2">
            <Textarea value={draft.goals} placeholder="Goals" onChange={(value) => setDraft((current) => ({ ...current, goals: value }))} />
            <Textarea value={draft.targetGigs} placeholder="Target gigs" onChange={(value) => setDraft((current) => ({ ...current, targetGigs: value }))} />
            <Textarea value={draft.pricingStrategy} placeholder="Pricing strategy" onChange={(value) => setDraft((current) => ({ ...current, pricingStrategy: value }))} />
            <Textarea value={draft.outreachPlan} placeholder="Outreach plan" onChange={(value) => setDraft((current) => ({ ...current, outreachPlan: value }))} />
            <Textarea value={draft.proofAssetsNeeded} placeholder="Proof assets needed" onChange={(value) => setDraft((current) => ({ ...current, proofAssetsNeeded: value }))} />
            <Textarea value={draft.notes} placeholder="Notes" onChange={(value) => setDraft((current) => ({ ...current, notes: value }))} />
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base">Targets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-2">
              <Input type="number" value={draft.monthlyRevenueTarget ?? ''} placeholder="Monthly revenue target" onChange={(event) => setDraft((current) => ({ ...current, monthlyRevenueTarget: Number(event.target.value) }))} />
              <Input type="number" value={draft.weeklyMessageTarget ?? ''} placeholder="Weekly message target" onChange={(event) => setDraft((current) => ({ ...current, weeklyMessageTarget: Number(event.target.value) }))} />
              <Input type="number" value={draft.weeklyOrderTarget ?? ''} placeholder="Weekly order target" onChange={(event) => setDraft((current) => ({ ...current, weeklyOrderTarget: Number(event.target.value) }))} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">Goals Checklist</CardTitle>
                <Badge variant="outline">{completedMilestones}/{draft.milestones.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-2">
              {draft.milestones.map((milestone) => (
                <div key={milestone.id} className="rounded-lg border p-3">
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={milestone.done}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          milestones: current.milestones.map((item) =>
                            item.id === milestone.id ? { ...item, done: event.target.checked } : item
                          ),
                        }))
                      }
                    />
                    {milestone.title}
                  </label>
                  <Input
                    type="date"
                    value={milestone.dueDate}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        milestones: current.milestones.map((item) =>
                          item.id === milestone.id ? { ...item, dueDate: event.target.value } : item
                        ),
                      }))
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
