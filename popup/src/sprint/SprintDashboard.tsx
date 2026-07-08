import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { SprintDashboardView } from './types'
import { useSprintStore } from './useSprintStore'
import { OverviewPanel } from './panels/OverviewPanel'
import { TodayPanel } from './panels/TodayPanel'
import { ProfilePanel } from './panels/ProfilePanel'
import { GigsPanel } from './panels/GigsPanel'
import { AnalyticsPanel } from './panels/AnalyticsPanel'
import { HabitsPanel } from './panels/HabitsPanel'
import { LeadsPanel } from './panels/LeadsPanel'
import { ProofPanel } from './panels/ProofPanel'
import { WeeklyPanel } from './panels/WeeklyPanel'
import { SeptemberPanel } from './panels/SeptemberPanel'
import { CompetitorsPanel } from './panels/CompetitorsPanel'
import { SeoPanel } from './panels/SeoPanel'
import { CommandPanel } from './panels/CommandPanel'
import { TodoistPanel } from './panels/TodoistPanel'
import { useTodoist } from './useTodoist'

function SprintSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-36 w-full" />
      <div className="grid gap-3 md:grid-cols-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  )
}

function SprintError({ message, onReset }: { message?: string | null; onReset: () => void }) {
  return (
    <Card className="border-red-500/30">
      <CardContent className="flex flex-col items-center justify-center gap-3 p-8 text-center">
        <AlertTriangle className="h-10 w-10 text-red-500" />
        <div>
          <p className="font-semibold">Sprint dashboard could not load</p>
          <p className="mt-1 text-sm text-muted-foreground">{message || 'No sprint data is available.'}</p>
        </div>
        <Button variant="outline" onClick={onReset}>Reset Sprint Data</Button>
      </CardContent>
    </Card>
  )
}

export function SprintDashboard({ view }: { view: SprintDashboardView }) {
  const store = useSprintStore()
  const data = store.store
  const todoist = useTodoist(data, store.persist)

  if (store.loading) return <SprintSkeleton />
  if (!data || !store.stats) return <SprintError message={store.error} onReset={store.resetStore} />

  switch (view) {
    case 'sprint-todoist':
      return <TodoistPanel data={data} stats={store.stats} todoist={todoist} />
    case 'sprint-command':
      return (
        <CommandPanel
          data={data}
          stats={store.stats}
          nextAction={store.nextAction}
          setTaskStatus={store.setTaskStatus}
          upsertJournal={store.upsertJournal}
          todoist={todoist}
          onNavigate={() => undefined}
        />
      )
    case 'sprint-today':
      return (
        <TodayPanel
          todayTasks={store.stats.todayTasks}
          overdueTasks={store.stats.overdue}
          habits={data.habits}
          habitLogs={data.habitLogs}
          nextAction={store.nextAction}
          setTaskStatus={store.setTaskStatus}
          toggleHabit={store.toggleHabit}
          setHabitNotes={store.setHabitNotes}
        />
      )
    case 'sprint-profile':
      return (
        <ProfilePanel
          data={data}
          profile={data.profile}
          skills={data.skills}
          updateProfile={store.updateProfile}
          updateSkill={store.updateSkill}
        />
      )
    case 'sprint-gigs':
      return <GigsPanel gigs={data.gigs} updateGig={store.updateGig} />
    case 'sprint-analytics':
      return (
        <AnalyticsPanel
          entries={data.analytics}
          addAnalytics={store.addAnalytics}
          deleteAnalytics={store.deleteAnalytics}
        />
      )
    case 'sprint-habits':
      return (
        <HabitsPanel
          habits={data.habits}
          habitLogs={data.habitLogs}
          toggleHabit={store.toggleHabit}
          setHabitNotes={store.setHabitNotes}
        />
      )
    case 'sprint-leads':
      return (
        <LeadsPanel
          leads={data.leads}
          templates={data.templates}
          upsertLead={store.upsertLead}
          deleteLead={store.deleteLead}
        />
      )
    case 'sprint-proof':
      return (
        <ProofPanel
          proofAssets={data.proofAssets}
          gigs={data.gigs}
          upsertProof={store.upsertProof}
          deleteProof={store.deleteProof}
        />
      )
    case 'sprint-weekly':
      return (
        <WeeklyPanel
          weeklyReviews={data.weeklyReviews}
          upsertWeeklyReview={store.upsertWeeklyReview}
          deleteWeeklyReview={store.deleteWeeklyReview}
        />
      )
    case 'sprint-september':
      return (
        <SeptemberPanel
          plan={data.septemberPlan}
          updateSeptemberPlan={store.updateSeptemberPlan}
        />
      )
    case 'sprint-competitors':
      return (
        <CompetitorsPanel
          competitors={data.competitors}
          upsertCompetitor={store.upsertCompetitor}
          deleteCompetitor={store.deleteCompetitor}
        />
      )
    case 'sprint-seo':
      return (
        <SeoPanel
          keywords={data.seoKeywords}
          upsertSeoKeyword={store.upsertSeoKeyword}
          deleteSeoKeyword={store.deleteSeoKeyword}
        />
      )
    case 'sprint-overview':
    case 'sprint-board':
    default:
      return (
        <OverviewPanel
          data={data}
          stats={store.stats}
          nextAction={store.nextAction}
          setTaskStatus={store.setTaskStatus}
          upsertTask={store.upsertTask}
          exportJson={store.exportJson}
        />
      )
  }
}
