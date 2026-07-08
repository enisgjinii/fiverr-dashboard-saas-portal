import { useEffect, useMemo, useState } from 'react'
import { Pause, Play, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import type { HabitDefinition, HabitLog, SprintTask, TaskStatus } from '../types'
import type { UseSprintStoreReturn } from '../useSprintStore'
import { getTodayKey, habitStreak } from '../utils'
import { EmptyState, NextActionCard, QuickCompleteButton, StreakBadge, TaskRow } from '../components'

interface TodayPanelProps {
  todayTasks: SprintTask[]
  overdueTasks: SprintTask[]
  habits: HabitDefinition[]
  habitLogs: HabitLog[]
  nextAction: SprintTask | null
  setTaskStatus: UseSprintStoreReturn['setTaskStatus']
  toggleHabit: UseSprintStoreReturn['toggleHabit']
  setHabitNotes: UseSprintStoreReturn['setHabitNotes']
}

const formatTimer = (seconds: number) => {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0')
  const rest = (seconds % 60).toString().padStart(2, '0')
  return `${minutes}:${rest}`
}

export function TodayPanel({
  todayTasks,
  overdueTasks,
  habits,
  habitLogs,
  nextAction,
  setTaskStatus,
  toggleHabit,
  setHabitNotes,
}: TodayPanelProps) {
  const today = getTodayKey()
  const [secondsLeft, setSecondsLeft] = useState(25 * 60)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running) return undefined
    const id = window.setInterval(() => {
      setSecondsLeft((value) => {
        if (value <= 1) {
          setRunning(false)
          return 0
        }
        return value - 1
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [running])

  const todayHabitRows = useMemo(
    () =>
      habits.map((habit) => ({
        habit,
        log: habitLogs.find((log) => log.habitId === habit.id && log.date === today),
        streak: habitStreak(habit.id, habitLogs, today),
      })),
    [habitLogs, habits, today]
  )

  const doneHabits = todayHabitRows.filter((row) => row.log?.completed).length
  const habitPct = todayHabitRows.length ? Math.round((doneHabits / todayHabitRows.length) * 100) : 0

  const renderTask = (task: SprintTask) => (
    <TaskRow
      key={task.id}
      task={task}
      onToggle={() => setTaskStatus(task.id, task.status === 'done' ? 'todo' : 'done')}
      onStatus={(nextStatus: TaskStatus) => setTaskStatus(task.id, nextStatus)}
    />
  )

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        <NextActionCard
          task={nextAction}
          reason="Recommended from priority, due date, and current sprint stage."
          onComplete={() => nextAction && setTaskStatus(nextAction.id, 'done')}
          onStart={() => nextAction && setTaskStatus(nextAction.id, 'in_progress')}
        />

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Today&apos;s Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-4 pt-2">
            {todayTasks.length ? todayTasks.map(renderTask) : <EmptyState title="No tasks due today" desc="Use the next best action or keep habits moving." />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Overdue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-4 pt-2">
            {overdueTasks.length ? overdueTasks.map(renderTask) : <EmptyState title="No overdue tasks" desc="Good. Keep today's queue clean." />}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-5">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Focus Timer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-2">
            <div className="rounded-xl border bg-muted/30 p-5 text-center">
              <p className="text-4xl font-bold tabular-nums">{formatTimer(secondsLeft)}</p>
              <p className="mt-1 text-xs text-muted-foreground">25 minute sprint block</p>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => setRunning((value) => !value)}>
                {running ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                {running ? 'Pause' : 'Start'}
              </Button>
              <Button variant="outline" onClick={() => { setRunning(false); setSecondsLeft(25 * 60) }}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">Daily Habits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-2">
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{doneHabits}/{todayHabitRows.length} complete</span>
                <span className="font-medium">{habitPct}%</span>
              </div>
              <Progress value={habitPct} className="h-2" />
            </div>
            {todayHabitRows.map(({ habit, log, streak }) => (
              <div key={habit.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{habit.title}</p>
                    {habit.description && <p className="text-xs text-muted-foreground">{habit.description}</p>}
                    <div className="mt-2"><StreakBadge streak={streak} /></div>
                  </div>
                  <QuickCompleteButton done={!!log?.completed} onClick={() => toggleHabit(habit.id, today)} />
                </div>
                <Input
                  className="mt-3 h-8 text-xs"
                  defaultValue={log?.notes ?? ''}
                  placeholder="Habit notes..."
                  onBlur={(event) => setHabitNotes(habit.id, event.target.value, today)}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
