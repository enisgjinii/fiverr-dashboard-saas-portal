import { useMemo, useState } from 'react'
import { AlertTriangle, CalendarDays, CheckCircle2, Clock, Download, Flame, Search, Target, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { SprintSectionId, SprintStore, SprintTask, TaskPriority, TaskStatus } from '../types'
import { SPRINT_SECTIONS, SPRINT_TITLE } from '../types'
import type { UseSprintStoreReturn } from '../useSprintStore'
import { filterTasks, sectionShort } from '../utils'
import {
  EmptyState,
  FilterBar,
  MetricCard,
  NextActionCard,
  PriorityBadge,
  ProgressRing,
  SectionBadge,
  StatusBadge,
  TaskRow,
} from '../components'

type SprintStats = NonNullable<UseSprintStoreReturn['stats']>

interface OverviewPanelProps {
  data: SprintStore
  stats: SprintStats
  nextAction: SprintTask | null
  setTaskStatus: UseSprintStoreReturn['setTaskStatus']
  upsertTask: UseSprintStoreReturn['upsertTask']
  exportJson: UseSprintStoreReturn['exportJson']
}

const priorities: Array<TaskPriority | 'all'> = ['all', 'P1', 'P2', 'P3', 'P4']
const statuses: Array<TaskStatus | 'all'> = ['all', 'todo', 'in_progress', 'done', 'blocked', 'skipped']

export function OverviewPanel({
  data,
  stats,
  nextAction,
  setTaskStatus,
  upsertTask,
  exportJson,
}: OverviewPanelProps) {
  const [query, setQuery] = useState('')
  const [section, setSection] = useState<SprintSectionId | 'all'>('all')
  const [priority, setPriority] = useState<TaskPriority | 'all'>('all')
  const [status, setStatus] = useState<TaskStatus | 'all'>('all')

  const visibleTasks = useMemo(
    () => filterTasks(data.tasks, { q: query, section, priority, status }),
    [data.tasks, priority, query, section, status]
  )

  const groupedTasks = useMemo(
    () =>
      SPRINT_SECTIONS.map((item) => ({
        section: item,
        tasks: visibleTasks.filter((task) => task.section === item.id),
      })).filter((group) => group.tasks.length > 0),
    [visibleTasks]
  )

  const completionLabel = `${stats.completed}/${stats.total} tasks done`

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card">
        <CardContent className="p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="capitalize">{stats.phase.label}</Badge>
                <Badge variant="outline">{stats.day.remaining} days left</Badge>
                <Badge variant="outline">Day {stats.day.elapsed}/{stats.day.total}</Badge>
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{SPRINT_TITLE}</h1>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  Focus on profile readiness, money-lane gigs, proof assets, and buyer follow-up momentum.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-lg border bg-background/70 p-3">
                  <p className="text-[10px] uppercase text-muted-foreground">Momentum</p>
                  <p className="text-xl font-bold">{stats.momentum}/100</p>
                </div>
                <div className="rounded-lg border bg-background/70 p-3">
                  <p className="text-[10px] uppercase text-muted-foreground">Readiness</p>
                  <p className="text-xl font-bold">{stats.profileScore}%</p>
                </div>
                <div className="rounded-lg border bg-background/70 p-3">
                  <p className="text-[10px] uppercase text-muted-foreground">Velocity</p>
                  <p className="text-xl font-bold">{stats.completed} shipped</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ProgressRing value={stats.profileScore} size={104} stroke={8} label="ready" />
              <div className="space-y-2">
                <p className="text-sm font-semibold">{completionLabel}</p>
                <Progress value={stats.pct} className="h-2 w-44" />
                <Button size="sm" variant="outline" onClick={exportJson}>
                  <Download className="mr-2 h-4 w-4" />
                  Export JSON
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total" value={stats.total} sub={completionLabel} icon={Target} />
        <MetricCard label="Done" value={stats.completed} sub={`${stats.pct}% complete`} icon={CheckCircle2} accent="green" />
        <MetricCard label="Remaining" value={stats.remaining} sub={`${stats.inProgress.length} in progress`} icon={Clock} accent="blue" />
        <MetricCard label="Today" value={stats.todayTasks.length} sub={`${stats.overdue.length} overdue`} icon={CalendarDays} accent="amber" />
        <MetricCard label="Overdue" value={stats.overdue.length} sub="Needs triage" icon={AlertTriangle} accent={stats.overdue.length ? 'red' : 'green'} />
        <MetricCard label="This Week" value={stats.thisWeek.length} sub="Open due soon" icon={Flame} accent="primary" />
        <MetricCard label="P1 / P2" value={stats.highPriority.length} sub="High leverage open tasks" icon={Zap} accent="red" />
        <MetricCard label="Gig Readiness" value={`${stats.gigAvg}%`} sub="Average money lanes" icon={Target} accent="blue" />
      </div>

      <NextActionCard
        task={nextAction}
        reason="Highest-leverage open item based on due date, priority, and sprint section."
        onComplete={() => nextAction && setTaskStatus(nextAction.id, 'done')}
        onStart={() => nextAction && setTaskStatus(nextAction.id, 'in_progress')}
      />

      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base">Section Progress</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 p-4 pt-2 md:grid-cols-2 xl:grid-cols-5">
          {stats.bySection.map((item) => (
            <button
              key={item.id}
              className={cn(
                'rounded-lg border p-3 text-left transition hover:border-primary/40',
                section === item.id && 'border-primary bg-primary/5'
              )}
              onClick={() => setSection(item.id)}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <SectionBadge section={item.id} />
                <span className="text-xs font-semibold">{item.pct}%</span>
              </div>
              <Progress value={item.pct} className="h-1.5" />
              <p className="mt-2 text-[11px] text-muted-foreground">
                {item.done}/{item.total} complete
              </p>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base">Sprint Task Board</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-2">
          <FilterBar>
            <div className="relative min-w-48 flex-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search tasks..." value={query} onChange={(event) => setQuery(event.target.value)} />
            </div>
            <select className="h-10 rounded-md border bg-background px-3 text-sm" value={section} onChange={(event) => setSection(event.target.value as SprintSectionId | 'all')}>
              <option value="all">All sections</option>
              {SPRINT_SECTIONS.map((item) => (
                <option key={item.id} value={item.id}>{item.id} · {item.shortLabel}</option>
              ))}
            </select>
            <select className="h-10 rounded-md border bg-background px-3 text-sm" value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority | 'all')}>
              {priorities.map((item) => <option key={item} value={item}>{item === 'all' ? 'All priorities' : item}</option>)}
            </select>
            <select className="h-10 rounded-md border bg-background px-3 text-sm" value={status} onChange={(event) => setStatus(event.target.value as TaskStatus | 'all')}>
              {statuses.map((item) => <option key={item} value={item}>{item === 'all' ? 'All statuses' : item.replace('_', ' ')}</option>)}
            </select>
            <Button variant="outline" onClick={() => { setQuery(''); setSection('all'); setPriority('all'); setStatus('all') }}>
              Reset
            </Button>
          </FilterBar>

          <ScrollArea className="h-[560px] pr-3">
            {groupedTasks.length === 0 ? (
              <EmptyState title="No tasks match these filters" desc="Clear filters or adjust the search query." />
            ) : (
              <div className="space-y-4">
                {groupedTasks.map((group) => (
                  <div key={group.section.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <SectionBadge section={group.section.id} />
                        <span className="text-xs text-muted-foreground">{sectionShort(group.section.id)}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{group.tasks.length} tasks</span>
                    </div>
                    <div className="space-y-2">
                      {group.tasks.map((task) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          onToggle={() => setTaskStatus(task.id, task.status === 'done' ? 'todo' : 'done')}
                          onStatus={(nextStatus) => setTaskStatus(task.id, nextStatus)}
                          onNotes={(notes) => upsertTask({ ...task, notes })}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="hidden">
        <PriorityBadge priority="P1" />
        <StatusBadge status="todo" />
      </div>
    </div>
  )
}
