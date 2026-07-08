import { CalendarCheck, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { HabitDefinition, HabitLog } from '../types'
import type { UseSprintStoreReturn } from '../useSprintStore'
import { bestHabitStreak, getTodayKey, habitStreak, parseDate } from '../utils'
import { MetricCard, QuickCompleteButton, StreakBadge } from '../components'

interface HabitsPanelProps {
  habits: HabitDefinition[]
  habitLogs: HabitLog[]
  toggleHabit: UseSprintStoreReturn['toggleHabit']
  setHabitNotes: UseSprintStoreReturn['setHabitNotes']
}

function lastDays(count: number) {
  const base = parseDate(getTodayKey()) ?? new Date()
  return Array.from({ length: count }, (_, index) => {
    const d = new Date(base)
    d.setDate(base.getDate() - (count - index - 1))
    return d.toISOString().slice(0, 10)
  })
}

export function HabitsPanel({ habits, habitLogs, toggleHabit, setHabitNotes }: HabitsPanelProps) {
  const today = getTodayKey()
  const dates = lastDays(14)
  const todayDone = habits.filter((habit) => habitLogs.some((log) => log.habitId === habit.id && log.date === today && log.completed)).length
  const bestStreak = habits.reduce((best, habit) => Math.max(best, bestHabitStreak(habit.id, habitLogs)), 0)

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard label="Today Complete" value={`${todayDone}/${habits.length}`} sub="Daily + weekly habits" icon={CalendarCheck} accent="green" />
        <MetricCard label="Best Streak" value={bestStreak} sub="Longest habit run" icon={Flame} accent="amber" />
        <MetricCard label="Weekly Habits" value={habits.filter((habit) => habit.frequency === 'weekly').length} sub="Highlighted below" icon={CalendarCheck} accent="blue" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {habits.map((habit) => {
          const log = habitLogs.find((item) => item.habitId === habit.id && item.date === today)
          const streak = habitStreak(habit.id, habitLogs, today)
          const best = bestHabitStreak(habit.id, habitLogs)

          return (
            <Card key={habit.id} className={cn(habit.frequency === 'weekly' && 'border-primary/30 bg-primary/5')}>
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <CardTitle className="text-base">{habit.title}</CardTitle>
                      <Badge variant={habit.frequency === 'weekly' ? 'default' : 'outline'}>{habit.frequency}</Badge>
                    </div>
                    {habit.description && <p className="text-xs text-muted-foreground">{habit.description}</p>}
                  </div>
                  <QuickCompleteButton done={!!log?.completed} onClick={() => toggleHabit(habit.id, today)} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-4 pt-2">
                <div className="flex flex-wrap items-center gap-2">
                  <StreakBadge streak={streak} />
                  <Badge variant="outline">Best {best}</Badge>
                  <Badge variant="outline">{habit.points} pts</Badge>
                </div>
                <div className="flex gap-1">
                  {dates.map((date) => {
                    const complete = habitLogs.some((item) => item.habitId === habit.id && item.date === date && item.completed)
                    return (
                      <span
                        key={date}
                        title={date}
                        className={cn(
                          'h-4 w-4 rounded-full border',
                          complete ? 'border-green-500 bg-green-500' : 'border-muted bg-muted/40'
                        )}
                      />
                    )
                  })}
                </div>
                <Input
                  className="h-8 text-xs"
                  defaultValue={log?.notes ?? ''}
                  placeholder="Today notes..."
                  onBlur={(event) => setHabitNotes(habit.id, event.target.value, today)}
                />
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
