import { useMemo, useState } from 'react'
import {
  BookOpen, Cloud, Flame, Loader2, RefreshCw, Rocket, Sparkles, Target, TrendingUp,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import type { DailyJournalEntry, SprintStore } from '../types'
import type { UseSprintStoreReturn } from '../useSprintStore'
import { getTodayKey } from '../utils'
import { MetricCard, NextActionCard, ProgressRing } from '../components'
import type { useTodoist } from '../useTodoist'

type TodoistHook = ReturnType<typeof useTodoist>

interface CommandPanelProps {
  data: SprintStore
  stats: NonNullable<UseSprintStoreReturn['stats']>
  nextAction: UseSprintStoreReturn['nextAction']
  upsertJournal: UseSprintStoreReturn['upsertJournal']
  setTaskStatus: UseSprintStoreReturn['setTaskStatus']
  onNavigate?: (view: string) => void
  todoist?: TodoistHook
}

export function CommandPanel({
  data,
  stats,
  nextAction,
  upsertJournal,
  setTaskStatus,
  onNavigate,
  todoist,
}: CommandPanelProps) {
  const today = getTodayKey()
  const journal = data.journal ?? []
  const existing = journal.find((j) => j.date === today)
  const [draft, setDraft] = useState<Partial<DailyJournalEntry>>(
    existing ?? { date: today, mood: 3, energy: 3, wins: '', blockers: '', tomorrowFocus: '', notes: '' }
  )

  const readiness = useMemo(() => ([
    { label: 'Profile', value: stats.profileScore },
    { label: 'Gigs', value: stats.gigAvg },
    { label: 'Habits', value: stats.habitPct },
    { label: 'Leads', value: Math.min(100, data.leads.filter((l) => l.status === 'warm' || l.status === 'closed').length * 20) },
    { label: 'Proof', value: Math.min(100, data.proofAssets.length * 15) },
    { label: 'SEO', value: Math.min(100, data.seoKeywords.filter((k) => k.status === 'in_use' || k.status === 'ranking').length * 12) },
  ]), [data.leads, data.proofAssets.length, data.seoKeywords, stats.gigAvg, stats.habitPct, stats.profileScore])

  const saveJournal = async () => {
    await upsertJournal({ ...draft, date: today })
  }

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden border-primary/25 bg-gradient-to-br from-primary/15 via-card to-card">
        <CardContent className="p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <Badge>Command Center</Badge>
              <h1 className="text-2xl font-bold tracking-tight">Sprint Mission Control</h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                One screen for momentum, readiness, next action, and daily reflection.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant="outline">Day {stats.day.elapsed}/{stats.day.total}</Badge>
                <Badge variant="outline">{stats.day.remaining} days left</Badge>
                <Badge variant="outline" className="capitalize">{stats.phase.label}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ProgressRing value={stats.momentum} size={110} stroke={9} label="momentum" />
              <div className="space-y-1 text-sm">
                <p className="font-semibold">{stats.pct}% sprint complete</p>
                <p className="text-muted-foreground">{stats.completed}/{stats.total} tasks</p>
                <p className="text-muted-foreground">Habits today {stats.todayHabitsDone}/6 · streak {stats.habitStreak}d</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Momentum" value={stats.momentum} sub="/100 score" icon={Flame} accent="primary" />
        <MetricCard label="Profile Ready" value={`${stats.profileScore}%`} icon={Target} accent="green" />
        <MetricCard label="Gig Avg" value={`${stats.gigAvg}%`} icon={Rocket} accent="blue" />
        <MetricCard label="Pipeline $" value={`$${stats.pipelineValue.toLocaleString()}`} icon={TrendingUp} accent="amber" />
      </div>

      {todoist && (
        <Card className="border-blue-500/20">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Cloud className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold">Todoist Sync</p>
                <p className="text-xs text-muted-foreground">
                  {todoist.connected
                    ? `${todoist.syncedCount}/${data.tasks.length} tasks linked · ${todoist.unsyncedCount} pending`
                    : 'Connect Todoist to sync sprint tasks across devices'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {todoist.connected ? (
                <Button size="sm" variant="outline" disabled={todoist.syncing} onClick={() => void todoist.runSync('both')}>
                  {todoist.syncing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                  Sync Now
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => onNavigate?.('sprint-todoist')}>
                  Connect Todoist
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <NextActionCard
        task={nextAction}
        reason="Highest leverage open item right now."
        onComplete={() => nextAction && setTaskStatus(nextAction.id, 'done')}
        onStart={() => nextAction && setTaskStatus(nextAction.id, 'in_progress')}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              Readiness Radar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-2">
            {readiness.map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span>{item.label}</span>
                  <span className="font-semibold">{item.value}%</span>
                </div>
                <Progress value={item.value} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4 text-primary" />
              Daily Journal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs">
                Mood (1-5)
                <input
                  type="number"
                  min={1}
                  max={5}
                  className="mt-1 h-9 w-full rounded-md border bg-background px-2"
                  value={draft.mood ?? 3}
                  onChange={(e) => setDraft((d) => ({ ...d, mood: Number(e.target.value) }))}
                />
              </label>
              <label className="text-xs">
                Energy (1-5)
                <input
                  type="number"
                  min={1}
                  max={5}
                  className="mt-1 h-9 w-full rounded-md border bg-background px-2"
                  value={draft.energy ?? 3}
                  onChange={(e) => setDraft((d) => ({ ...d, energy: Number(e.target.value) }))}
                />
              </label>
            </div>
            <Textarea placeholder="Wins today..." value={draft.wins ?? ''} onChange={(e) => setDraft((d) => ({ ...d, wins: e.target.value }))} />
            <Textarea placeholder="Blockers..." value={draft.blockers ?? ''} onChange={(e) => setDraft((d) => ({ ...d, blockers: e.target.value }))} />
            <Textarea placeholder="Tomorrow focus..." value={draft.tomorrowFocus ?? ''} onChange={(e) => setDraft((d) => ({ ...d, tomorrowFocus: e.target.value }))} />
            <Button onClick={saveJournal}>Save Journal</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base">Quick Jump</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 p-4 pt-2">
          {[
            ['sprint-today', 'Today'],
            ['sprint-profile', 'Profile'],
            ['sprint-gigs', 'Gigs'],
            ['sprint-analytics', 'Analytics'],
            ['sprint-leads', 'Leads'],
            ['sprint-competitors', 'Competitors'],
            ['sprint-seo', 'SEO'],
            ['sprint-september', 'September'],
          ].map(([view, label]) => (
            <Button key={view} size="sm" variant="outline" onClick={() => onNavigate?.(view)}>
              {label}
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
