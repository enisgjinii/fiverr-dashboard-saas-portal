import {
  SPRINT_END,
  SPRINT_PHASES,
  SPRINT_SECTIONS,
  SPRINT_START,
  type AnalyticsEntry,
  type BuyerLead,
  type GigTrack,
  type HabitLog,
  type SprintPhase,
  type SprintSectionId,
  type SprintStore,
  type SprintTask,
  type SubStatus,
  type TaskPriority,
  type TaskStatus,
} from './types'

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  P1: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
  P2: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  P3: 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400',
  P4: 'border-muted bg-muted/50 text-muted-foreground',
}

export const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: 'border-muted bg-muted/40 text-muted-foreground',
  in_progress: 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400',
  done: 'border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400',
  blocked: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
  skipped: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-600 dark:text-zinc-400',
}

export const LEAD_STATUS_COLORS: Record<BuyerLead['status'], string> = {
  new: 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400',
  replied: 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400',
  waiting: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  warm: 'border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400',
  closed: 'border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400',
  lost: 'border-muted bg-muted/40 text-muted-foreground',
}

export const GIG_STATUS_COLORS: Record<GigTrack['status'], string> = {
  not_started: 'border-muted bg-muted/40 text-muted-foreground',
  in_progress: 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400',
  review: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  live: 'border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400',
  paused: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-600 dark:text-zinc-400',
}

export const SUB_STATUS_COLORS: Record<SubStatus, string> = {
  not_started: 'border-muted bg-muted/40 text-muted-foreground',
  in_progress: 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400',
  done: 'border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400',
  needs_revision: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export const newId = uid
export const getTodayKey = todayISO

export function parseDate(iso?: string): Date | null {
  if (!iso) return null
  const d = new Date(`${iso}T12:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

export function formatShortDate(iso?: string): string {
  const d = parseDate(iso)
  if (!d) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function daysBetween(a: string, b: string): number {
  const da = parseDate(a)
  const db = parseDate(b)
  if (!da || !db) return 0
  return Math.round((db.getTime() - da.getTime()) / 86400000)
}

export function sprintDayInfo(now = todayISO()) {
  const total = Math.max(1, daysBetween(SPRINT_START, SPRINT_END) + 1)
  const elapsed = Math.min(total, Math.max(0, daysBetween(SPRINT_START, now) + 1))
  const remaining = Math.max(0, total - elapsed)
  const pct = Math.round((elapsed / total) * 100)
  return { total, elapsed, remaining, pct, start: SPRINT_START, end: SPRINT_END }
}

export function getCurrentPhase(now = todayISO()): SprintPhase {
  return (
    SPRINT_PHASES.find((p) => now >= p.start && now <= p.end) ??
    SPRINT_PHASES[SPRINT_PHASES.length - 1]
  )
}

export function startOfWeek(iso = todayISO()): string {
  const d = parseDate(iso)!
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

export function endOfWeek(iso = todayISO()): string {
  const start = parseDate(startOfWeek(iso))!
  start.setDate(start.getDate() + 6)
  return start.toISOString().slice(0, 10)
}

export function isToday(iso?: string): boolean {
  return !!iso && iso === todayISO()
}

export function isOverdue(task: SprintTask, now = todayISO()): boolean {
  if (task.status === 'done' || !task.dueDate) return false
  return task.dueDate < now
}

export function isThisWeek(iso?: string, now = todayISO()): boolean {
  if (!iso) return false
  return iso >= startOfWeek(now) && iso <= endOfWeek(now)
}

export function sectionLabel(id: SprintSectionId): string {
  return SPRINT_SECTIONS.find((s) => s.id === id)?.label ?? id
}

export function sectionShort(id: SprintSectionId): string {
  return SPRINT_SECTIONS.find((s) => s.id === id)?.shortLabel ?? id
}

export function priorityWeight(p: TaskPriority): number {
  return { P1: 4, P2: 3, P3: 2, P4: 1 }[p]
}

export function gigCompletion(gig: GigTrack): number {
  const parts: SubStatus[] = [
    gig.thumbnailStatus,
    gig.descriptionStatus,
    gig.packagesStatus,
    gig.faqStatus,
    gig.galleryStatus,
    gig.videoStatus,
  ]
  const done = parts.filter((p) => p === 'done').length
  const inProg = parts.filter((p) => p === 'in_progress').length
  return Math.round(((done + inProg * 0.5) / parts.length) * 100)
}

export function computeCtr(entry: AnalyticsEntry): number | null {
  if (!entry.impressions || entry.impressions <= 0 || entry.clicks == null) return null
  return Math.round((entry.clicks / entry.impressions) * 1000) / 10
}

export function computeMsgRate(entry: AnalyticsEntry): number | null {
  if (!entry.clicks || entry.clicks <= 0 || entry.messages == null) return null
  return Math.round((entry.messages / entry.clicks) * 1000) / 10
}

export function computeOrderRate(entry: AnalyticsEntry): number | null {
  if (!entry.messages || entry.messages <= 0 || entry.orders == null) return null
  return Math.round((entry.orders / entry.messages) * 1000) / 10
}

export function analyticsDelta(current?: AnalyticsEntry, baseline?: AnalyticsEntry) {
  if (!current || !baseline) return null
  const keys = ['impressions', 'clicks', 'messages', 'orders'] as const
  const out: Record<string, { current: number; baseline: number; delta: number; pct: number | null }> = {}
  for (const k of keys) {
    const c = current[k] ?? 0
    const b = baseline[k] ?? 0
    const delta = c - b
    const pct = b > 0 ? Math.round((delta / b) * 1000) / 10 : null
    out[k] = { current: c, baseline: b, delta, pct }
  }
  return out
}

export function habitStreak(habitId: string, logs: HabitLog[], now = todayISO()): number {
  let streak = 0
  const d = parseDate(now)!
  for (let i = 0; i < 90; i++) {
    const iso = d.toISOString().slice(0, 10)
    const hit = logs.find((l) => l.habitId === habitId && l.date === iso && l.completed)
    if (!hit) {
      if (i === 0) {
        d.setDate(d.getDate() - 1)
        continue
      }
      break
    }
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

export function toggleHabitForDate(logs: HabitLog[], habitId: string, date = todayISO()): HabitLog[] {
  const existing = logs.find((l) => l.habitId === habitId && l.date === date)
  if (existing) {
    return logs.map((l) =>
      l.habitId === habitId && l.date === date
        ? {
            ...l,
            completed: !l.completed,
            completedAt: !l.completed ? new Date().toISOString() : undefined,
          }
        : l
    )
  }

  return [
    ...logs,
    {
      habitId,
      date,
      completed: true,
      completedAt: new Date().toISOString(),
    },
  ]
}

export function bestHabitStreak(habitId: string, logs: HabitLog[]): number {
  const dates = logs
    .filter((l) => l.habitId === habitId && l.completed)
    .map((l) => l.date)
    .sort()
  if (!dates.length) return 0
  let best = 1
  let cur = 1
  for (let i = 1; i < dates.length; i++) {
    if (daysBetween(dates[i - 1], dates[i]) === 1) {
      cur++
      best = Math.max(best, cur)
    } else if (dates[i] !== dates[i - 1]) {
      cur = 1
    }
  }
  return best
}

export function sectionProgress(tasks: SprintTask[], section: SprintSectionId) {
  const list = tasks.filter((t) => t.section === section)
  const done = list.filter((t) => t.status === 'done').length
  const total = list.length
  const pct = total ? Math.round((done / total) * 100) : 0
  return { total, done, remaining: total - done, pct }
}

export function computeSprintStats(store: SprintStore, now = todayISO()) {
  const tasks = store.tasks
  const total = tasks.length
  const completed = tasks.filter((t) => t.status === 'done').length
  const remaining = total - completed
  const pct = total ? Math.round((completed / total) * 100) : 0
  const todayTasks = tasks.filter((t) => isToday(t.dueDate) || (t.section === '00' && t.status !== 'done'))
  const overdue = tasks.filter((t) => isOverdue(t, now))
  const thisWeek = tasks.filter((t) => isThisWeek(t.dueDate, now) && t.status !== 'done')
  const highPriority = tasks.filter((t) => (t.priority === 'P1' || t.priority === 'P2') && t.status !== 'done')
  const inProgress = tasks.filter((t) => t.status === 'in_progress')
  const phase = getCurrentPhase(now)
  const day = sprintDayInfo(now)

  const bySection = SPRINT_SECTIONS.map((s) => ({
    ...s,
    ...sectionProgress(tasks, s.id),
  }))

  const lowestSection = [...bySection]
    .filter((s) => s.total > 0)
    .sort((a, b) => a.pct - b.pct || priorityWeight('P1') - priorityWeight('P1'))[0]

  const todayHabitsDone = store.habitLogs.filter((l) => l.date === now && l.completed).length
  const habitDefs = 6
  const habitPct = Math.round((todayHabitsDone / habitDefs) * 100)

  const openLeads = store.leads.filter((l) => !['closed', 'lost'].includes(l.status)).length
  const dueFollowUps = store.leads.filter(
    (l) => l.nextFollowUpDate && l.nextFollowUpDate <= now && !['closed', 'lost'].includes(l.status)
  ).length
  const warmLeads = store.leads.filter((l) => l.status === 'warm').length

  const gigAvg =
    store.gigs.length > 0
      ? Math.round(store.gigs.reduce((s, g) => s + gigCompletion(g), 0) / store.gigs.length)
      : 0

  const profileScore = computeProfileScore(store)
  const momentum = computeMomentumScore(store, now)
  const habitStreak = computeHabitStreak(store.habitLogs, now)
  const pipelineValue = store.leads
    .filter((l) => !['closed', 'lost'].includes(l.status))
    .reduce((sum, l) => {
      const n = Number(String(l.budget).replace(/[^0-9.]/g, ''))
      return sum + (Number.isFinite(n) ? n : 0)
    }, 0)

  return {
    total,
    completed,
    remaining,
    pct,
    todayTasks,
    overdue,
    thisWeek,
    highPriority,
    inProgress,
    phase,
    day,
    bySection,
    lowestSection,
    todayHabitsDone,
    habitPct,
    habitStreak,
    openLeads,
    dueFollowUps,
    warmLeads,
    pipelineValue,
    gigAvg,
    profileScore,
    momentum,
  }
}

export function computeHabitStreak(logs: HabitLog[], now = todayISO()): number {
  const habitCount = 6
  let streak = 0
  const cursor = new Date(`${now}T12:00:00`)
  for (let i = 0; i < 60; i++) {
    const key = cursor.toISOString().slice(0, 10)
    const done = logs.filter((l) => l.date === key && l.completed).length
    if (done >= Math.ceil(habitCount / 2)) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    } else if (i === 0) {
      // today incomplete doesn't break past streak
      cursor.setDate(cursor.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}

export function computeProfileScore(store: SprintStore): number {
  const p = store.profile
  let score = 0
  if (p.newTitle?.trim()) score += 15
  if (p.newDescription?.trim()) score += 20
  if (p.trustLineAdded) score += 15
  if (p.weakServicesRemoved) score += 10
  if (p.skillsUpdated) score += 10
  if (p.beforeScreenshotUrl) score += 10
  if (p.afterScreenshotUrl) score += 10
  const keep = store.skills.filter((s) => s.action === 'keep').length
  const remove = store.skills.filter((s) => s.action === 'remove').length
  if (keep >= 10) score += 5
  if (remove >= 2) score += 5
  return Math.min(100, score)
}

export function computeMomentumScore(store: SprintStore, now = todayISO()): number {
  const stats = {
    taskPct: store.tasks.length
      ? store.tasks.filter((t) => t.status === 'done').length / store.tasks.length
      : 0,
    habits: store.habitLogs.filter((l) => l.date === now && l.completed).length / 6,
    gigs: store.gigs.length
      ? store.gigs.reduce((s, g) => s + gigCompletion(g), 0) / store.gigs.length / 100
      : 0,
    leads: Math.min(1, store.leads.filter((l) => !['lost'].includes(l.status)).length / 5),
    proof: Math.min(1, store.proofAssets.length / 6),
    analytics: Math.min(1, store.analytics.filter((a) => (a.impressions ?? 0) > 0).length / 3),
  }
  const score =
    stats.taskPct * 30 +
    stats.habits * 15 +
    stats.gigs * 20 +
    stats.leads * 15 +
    stats.proof * 10 +
    stats.analytics * 10
  return Math.round(score)
}

export function getNextBestAction(store: SprintStore, now = todayISO()): SprintTask | null {
  const open = store.tasks.filter((t) => t.status !== 'done')
  const overdueP1 = open.filter((t) => isOverdue(t, now) && t.priority === 'P1')
  if (overdueP1.length) return sortTasks(overdueP1)[0]

  const todayP1 = open.filter((t) => isToday(t.dueDate) && t.priority === 'P1')
  if (todayP1.length) return sortTasks(todayP1)[0]

  const todayP2 = open.filter((t) => isToday(t.dueDate) && t.priority === 'P2')
  if (todayP2.length) return sortTasks(todayP2)[0]

  const weekP1 = open.filter((t) => isThisWeek(t.dueDate, now) && t.priority === 'P1')
  if (weekP1.length) return sortTasks(weekP1)[0]

  const habitOpen = open.find((t) => t.section === '01' && t.labels?.includes('habit'))
  const todayHabitDone = (id: string) =>
    store.habitLogs.some((l) => l.habitId === id && l.date === now && l.completed)
  if (habitOpen && !todayHabitDone(habitOpen.id.replace('task_', 'habit_'))) {
    // fall through to named baseline task preference
  }

  const baseline = open.find((t) => t.id === 'task_baseline_analytics')
  if (baseline) return baseline

  const incompleteHabit = open.find((t) => t.section === '01')
  if (incompleteHabit) return incompleteHabit

  const bySection = SPRINT_SECTIONS.map((s) => ({ id: s.id, ...sectionProgress(open.concat(store.tasks.filter((t) => t.status === 'done')), s.id) }))
  const lowest = [...bySection].filter((s) => s.remaining > 0).sort((a, b) => a.pct - b.pct)[0]
  if (lowest) {
    const candidate = open.filter((t) => t.section === lowest.id)
    if (candidate.length) return sortTasks(candidate)[0]
  }

  return sortTasks(open)[0] ?? null
}

export function sortTasks(tasks: SprintTask[]): SprintTask[] {
  return [...tasks].sort((a, b) => {
    const pw = priorityWeight(b.priority) - priorityWeight(a.priority)
    if (pw !== 0) return pw
    const ad = a.dueDate ?? '9999'
    const bd = b.dueDate ?? '9999'
    if (ad !== bd) return ad.localeCompare(bd)
    return a.title.localeCompare(b.title)
  })
}

export function filterTasks(
  tasks: SprintTask[],
  opts: {
    q?: string
    section?: SprintSectionId | 'all'
    priority?: TaskPriority | 'all'
    status?: SprintTask['status'] | 'all'
    label?: string | 'all'
    due?: 'all' | 'today' | 'week' | 'overdue' | 'none'
  }
): SprintTask[] {
  const now = todayISO()
  return sortTasks(
    tasks.filter((t) => {
      if (opts.section && opts.section !== 'all' && t.section !== opts.section) return false
      if (opts.priority && opts.priority !== 'all' && t.priority !== opts.priority) return false
      if (opts.status && opts.status !== 'all' && t.status !== opts.status) return false
      if (opts.label && opts.label !== 'all' && !(t.labels || []).includes(opts.label)) return false
      if (opts.due === 'today' && !isToday(t.dueDate)) return false
      if (opts.due === 'week' && !isThisWeek(t.dueDate, now)) return false
      if (opts.due === 'overdue' && !isOverdue(t, now)) return false
      if (opts.due === 'none' && t.dueDate) return false
      if (opts.q) {
        const q = opts.q.toLowerCase()
        const hay = `${t.title} ${t.description || ''} ${(t.labels || []).join(' ')} ${t.notes || ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  )
}

export function leadPipeline(leads: BuyerLead[]) {
  const stages: BuyerLead['status'][] = ['new', 'replied', 'waiting', 'warm', 'closed', 'lost']
  return stages.map((status) => ({
    status,
    count: leads.filter((l) => l.status === status).length,
    leads: leads.filter((l) => l.status === status),
  }))
}

export function exportSprintJson(store: SprintStore): string {
  return JSON.stringify(store, null, 2)
}

export function downloadText(filename: string, content: string, mime = 'application/json') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
