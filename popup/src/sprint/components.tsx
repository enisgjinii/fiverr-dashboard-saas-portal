import React from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import {
  CheckCircle2, Circle, Clock, AlertTriangle, Flame, Target, Zap,
  ChevronRight, Play, RotateCcw, StickyNote, ArrowRight,
} from 'lucide-react'
import type { SprintSectionId, SprintTask, TaskPriority, TaskStatus, LeadStatus, GigStatus, SubStatus } from './types'
import { SPRINT_SECTIONS } from './types'
import { PRIORITY_COLORS, STATUS_COLORS, LEAD_STATUS_COLORS, GIG_STATUS_COLORS, SUB_STATUS_COLORS, formatShortDate, isOverdue, isToday } from './utils'

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <Badge variant="outline" className={cn('text-[10px] font-bold px-1.5 py-0 border', PRIORITY_COLORS[priority])}>
      {priority}
    </Badge>
  )
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  const labels: Record<TaskStatus, string> = {
    todo: 'To Do',
    in_progress: 'In Progress',
    done: 'Done',
    blocked: 'Blocked',
    skipped: 'Skipped',
  }
  return (
    <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 border', STATUS_COLORS[status])}>
      {labels[status]}
    </Badge>
  )
}

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return (
    <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 border capitalize', LEAD_STATUS_COLORS[status])}>
      {status}
    </Badge>
  )
}

export function GigStatusBadge({ status }: { status: GigStatus }) {
  const labels: Record<GigStatus, string> = {
    not_started: 'Not Started', in_progress: 'In Progress', review: 'Review', live: 'Live',
    paused: 'Paused',
  }
  return (
    <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 border', GIG_STATUS_COLORS[status])}>
      {labels[status]}
    </Badge>
  )
}

export function SubStatusBadge({ status }: { status: SubStatus }) {
  const labels: Record<SubStatus, string> = {
    not_started: 'Todo', in_progress: 'WIP', done: 'Done',
    needs_revision: 'Revise',
  }
  return (
    <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium', SUB_STATUS_COLORS[status])}>
      {labels[status]}
    </span>
  )
}

export function SectionBadge({ section }: { section: SprintSectionId }) {
  const sectionMeta = SPRINT_SECTIONS.find((item) => item.id === section)

  return (
    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border bg-muted/40">
      {sectionMeta ? `${sectionMeta.id} · ${sectionMeta.shortLabel}` : section}
    </Badge>
  )
}

export function MetricCard({
  label, value, sub, icon: Icon, accent = 'default', onClick,
}: {
  label: string
  value: string | number
  sub?: string
  icon?: React.ElementType
  accent?: 'default' | 'green' | 'red' | 'amber' | 'blue' | 'primary'
  onClick?: () => void
}) {
  const accents = {
    default: 'text-foreground',
    green: 'text-green-500',
    red: 'text-red-500',
    amber: 'text-amber-500',
    blue: 'text-blue-500',
    primary: 'text-primary',
  }
  return (
    <Card
      className={cn('p-3 transition-all', onClick && 'cursor-pointer hover:border-primary/40 hover:shadow-md')}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
        {Icon && <Icon className={cn('h-3.5 w-3.5', accents[accent])} />}
      </div>
      <p className={cn('text-xl font-bold tabular-nums', accents[accent])}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </Card>
  )
}

export function ProgressRing({ value, size = 72, stroke = 6, label }: { value: number; size?: number; stroke?: number; label?: string }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (Math.min(100, Math.max(0, value)) / 100) * circ
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-muted" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          className="text-primary transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold">{Math.round(value)}%</span>
        {label && <span className="text-[8px] text-muted-foreground">{label}</span>}
      </div>
    </div>
  )
}

export function NextActionCard({
  task, reason, onComplete, onStart, onOpen,
}: {
  task: SprintTask | null
  reason: string
  onComplete: () => void
  onStart: () => void
  onOpen?: () => void
}) {
  if (!task) {
    return (
      <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-green-500/15 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <p className="text-sm font-semibold">All clear</p>
            <p className="text-xs text-muted-foreground">No urgent next action — keep shipping daily habits.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-lg shadow-primary/5">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Next Best Action</p>
              <PriorityBadge priority={task.priority} />
              {isOverdue(task) && (
                <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-500 bg-red-500/10">Overdue</Badge>
              )}
            </div>
            <p className="text-base font-semibold leading-snug">{task.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{reason}</p>
            {task.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>}
            <div className="flex flex-wrap gap-2 mt-3">
              {task.status !== 'done' && (
                <Button size="sm" onClick={onComplete}>
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />Complete
                </Button>
              )}
              {task.status === 'todo' && (
                <Button size="sm" variant="outline" onClick={onStart}>
                  <Play className="h-3.5 w-3.5 mr-1.5" />Start
                </Button>
              )}
              {onOpen && (
                <Button size="sm" variant="ghost" onClick={onOpen}>
                  Details <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function TaskRow({
  task, onToggle, onStatus, onNotes,
}: {
  task: SprintTask
  onToggle: () => void
  onStatus?: (s: TaskStatus) => void
  onNotes?: (notes: string) => void
}) {
  const [showNotes, setShowNotes] = React.useState(false)
  const overdue = isOverdue(task)
  const today = isToday(task.dueDate)

  return (
    <div className={cn(
      'group rounded-lg border p-3 transition-all hover:border-primary/30',
      task.status === 'done' && 'opacity-60 bg-muted/30',
      overdue && task.status !== 'done' && 'border-red-500/30 bg-red-500/5',
    )}>
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors"
          title={task.status === 'done' ? 'Reopen' : 'Complete'}
        >
          {task.status === 'done'
            ? <CheckCircle2 className="h-5 w-5 text-green-500" />
            : task.status === 'in_progress'
              ? <Clock className="h-5 w-5 text-blue-500" />
              : <Circle className="h-5 w-5" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={cn('text-sm font-medium leading-snug', task.status === 'done' && 'line-through text-muted-foreground')}>
              {task.title}
            </p>
            <div className="flex items-center gap-1.5 shrink-0">
              {task.todoistId && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border bg-blue-500/10 text-blue-600 border-blue-500/30" title="Synced to Todoist">
                  TD
                </Badge>
              )}
              <PriorityBadge priority={task.priority} />
              <StatusBadge status={task.status} />
            </div>
          </div>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {task.dueDate && (
              <span className={cn(
                'text-[10px] flex items-center gap-1',
                overdue ? 'text-red-500 font-medium' : today ? 'text-amber-500 font-medium' : 'text-muted-foreground',
              )}>
                {overdue ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                {formatShortDate(task.dueDate)}
              </span>
            )}
            {task.duration && <span className="text-[10px] text-muted-foreground">{task.duration}</span>}
            {task.labels?.map((l) => (
              <Badge key={l} variant="secondary" className="text-[9px] px-1.5 py-0">{l}</Badge>
            ))}
            {task.status !== 'done' && onStatus && (
              <button
                className="text-[10px] text-primary hover:underline ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onStatus(task.status === 'todo' ? 'in_progress' : 'todo')}
              >
                {task.status === 'todo' ? 'Mark in progress' : 'Back to todo'}
              </button>
            )}
            {onNotes && (
              <button
                className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5"
                onClick={() => setShowNotes((v) => !v)}
              >
                <StickyNote className="h-3 w-3" /> Notes
              </button>
            )}
          </div>
          {showNotes && onNotes && (
            <div className="mt-2">
              <Input
                defaultValue={task.notes || ''}
                placeholder="Add notes..."
                className="text-xs h-8"
                onBlur={(e) => onNotes(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function SectionProgressBar({
  label, done, total, onClick,
}: {
  label: string
  done: number
  total: number
  onClick?: () => void
}) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium truncate">{label}</span>
        <span className="text-[10px] text-muted-foreground tabular-nums shrink-0 ml-2">
          {done}/{total} · {pct}%
        </span>
      </div>
      <Progress value={pct} className="h-1.5" />
    </button>
  )
}

export function EmptyBlock({ title, desc, action }: { title: string; desc?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center px-4">
      <Target className="h-10 w-10 text-muted-foreground/40 mb-3" />
      <p className="text-sm font-medium">{title}</p>
      {desc && <p className="text-xs text-muted-foreground mt-1 max-w-sm">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export const EmptyState = EmptyBlock

export function StreakBadge({ streak }: { streak: number }) {
  if (streak <= 0) return null
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500">
      <Flame className="h-3.5 w-3.5" />
      <span className="text-xs font-bold">{streak} day streak</span>
    </div>
  )
}

export function ScoreGauge({ score, label }: { score: number; label: string }) {
  const color = score >= 70 ? 'text-green-500' : score >= 40 ? 'text-amber-500' : 'text-red-500'
  return (
    <div className="text-center">
      <ProgressRing value={score} size={64} stroke={5} />
      <p className={cn('text-xs font-medium mt-1.5', color)}>{label}</p>
      <p className="text-[10px] text-muted-foreground">{score}/100</p>
    </div>
  )
}

export function QuickCompleteButton({ onClick, done }: { onClick: () => void; done: boolean }) {
  return (
    <Button
      size="sm"
      variant={done ? 'outline' : 'default'}
      onClick={onClick}
      className="h-7 text-xs"
    >
      {done ? <><RotateCcw className="h-3 w-3 mr-1" />Undo</> : <><CheckCircle2 className="h-3 w-3 mr-1" />Done</>}
    </Button>
  )
}

export function PageSection({
  title, subtitle, actions, children, className,
}: {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold tracking-tight">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
      </div>
      {children}
    </div>
  )
}

export function FilterChip({
  active, onClick, children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all',
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

export function FilterBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3', className)}>
      {children}
    </div>
  )
}

export function CtaRow({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-2 flex-wrap">{children}</div>
}

export function ArrowLink({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="text-xs text-primary font-medium inline-flex items-center gap-1 hover:underline">
      {children} <ArrowRight className="h-3 w-3" />
    </button>
  )
}
