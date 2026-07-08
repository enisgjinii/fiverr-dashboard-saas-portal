import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  AnalyticsEntry,
  BuyerLead,
  CompetitorWatch,
  DailyJournalEntry,
  GigTrack,
  HabitLog,
  ProfileChanges,
  ProofAsset,
  SeoKeyword,
  SeptemberScalePlan,
  SkillItem,
  SprintStore,
  SprintTask,
  TaskStatus,
  WeeklyReview,
} from './types'
import { loadSprintStore, resetSprintStore, saveSprintStore } from './storage'
import { loadTodoistConfig, saveTodoistConfig, syncSingleTaskToTodoist } from './todoist'
import {
  computeSprintStats,
  getNextBestAction,
  getTodayKey,
  newId,
  toggleHabitForDate,
} from './utils'

export function useSprintStore() {
  const [store, setStore] = useState<SprintStore | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    loadSprintStore()
      .then((data) => {
        if (mounted) {
          setStore(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load sprint')
          setLoading(false)
        }
      })
    return () => {
      mounted = false
    }
  }, [])

  const persist = useCallback(async (next: SprintStore) => {
    setStore(next)
    await saveSprintStore(next)
  }, [])

  const update = useCallback(
    async (updater: (prev: SprintStore) => SprintStore) => {
      setStore((prev) => {
        if (!prev) return prev
        const next = updater(prev)
        void saveSprintStore(next)
        return next
      })
    },
    []
  )

  const stats = useMemo(() => (store ? computeSprintStats(store) : null), [store])
  const nextAction = useMemo(() => (store ? getNextBestAction(store) : null), [store])

  const setTaskStatus = useCallback(
    async (taskId: string, status: TaskStatus) => {
      let updatedTask: SprintTask | null = null
      await update((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => {
          if (t.id === taskId) {
            updatedTask = {
              ...t,
              status,
              completedAt: status === 'done' ? new Date().toISOString() : undefined,
              updatedAt: new Date().toISOString(),
            }
            return updatedTask
          }
          return t
        }),
      }))

      if (updatedTask) {
        try {
          const config = await loadTodoistConfig()
          if (config.syncOnComplete && config.apiKey) {
            const { task, config: nextConfig } = await syncSingleTaskToTodoist(updatedTask, config)
            await saveTodoistConfig(nextConfig)
            await update((prev) => ({
              ...prev,
              tasks: prev.tasks.map((t) => (t.id === taskId ? task : t)),
            }))
          }
        } catch (e) {
          console.error('Todoist sync on complete failed', e)
        }
      }
    },
    [update]
  )

  const upsertTask = useCallback(
    async (task: Partial<SprintTask> & { title: string; section: SprintTask['section']; priority: SprintTask['priority'] }) => {
      await update((prev) => {
        if (task.id) {
          return {
            ...prev,
            tasks: prev.tasks.map((t) =>
              t.id === task.id
                ? { ...t, ...task, updatedAt: new Date().toISOString() }
                : t
            ),
          }
        }
        const now = new Date().toISOString()
        const created: SprintTask = {
          id: newId('task'),
          title: task.title,
          description: task.description ?? '',
          dueDate: task.dueDate,
          priority: task.priority,
          section: task.section,
          status: task.status ?? 'todo',
          duration: task.duration,
          labels: task.labels ?? [],
          notes: task.notes ?? '',
          impact: task.impact ?? 'medium',
          effort: task.effort ?? 's',
          createdAt: now,
          updatedAt: now,
        }
        return { ...prev, tasks: [created, ...prev.tasks] }
      })
    },
    [update]
  )

  const deleteTask = useCallback(
    async (taskId: string) => {
      await update((prev) => ({
        ...prev,
        tasks: prev.tasks.filter((t) => t.id !== taskId),
      }))
    },
    [update]
  )

  const updateProfile = useCallback(
    async (profile: Partial<ProfileChanges>) => {
      await update((prev) => ({
        ...prev,
        profile: { ...prev.profile, ...profile, updatedAt: new Date().toISOString() },
      }))
    },
    [update]
  )

  const updateSkill = useCallback(
    async (skillId: string, patch: Partial<SkillItem>) => {
      await update((prev) => ({
        ...prev,
        skills: prev.skills.map((s) => (s.id === skillId ? { ...s, ...patch } : s)),
      }))
    },
    [update]
  )

  const addAnalytics = useCallback(
    async (entry: Omit<AnalyticsEntry, 'id'>) => {
      await update((prev) => ({
        ...prev,
        analytics: [{ ...entry, id: newId('analytics') }, ...prev.analytics].sort((a, b) =>
          b.date.localeCompare(a.date)
        ),
      }))
    },
    [update]
  )

  const updateAnalytics = useCallback(
    async (id: string, patch: Partial<AnalyticsEntry>) => {
      await update((prev) => ({
        ...prev,
        analytics: prev.analytics.map((a) => (a.id === id ? { ...a, ...patch } : a)),
      }))
    },
    [update]
  )

  const deleteAnalytics = useCallback(
    async (id: string) => {
      await update((prev) => ({
        ...prev,
        analytics: prev.analytics.filter((a) => a.id !== id),
      }))
    },
    [update]
  )

  const updateGig = useCallback(
    async (id: string, patch: Partial<GigTrack>) => {
      await update((prev) => ({
        ...prev,
        gigs: prev.gigs.map((g) => (g.id === id ? { ...g, ...patch } : g)),
      }))
    },
    [update]
  )

  const toggleHabit = useCallback(
    async (habitId: string, date = getTodayKey()) => {
      await update((prev) => ({
        ...prev,
        habitLogs: toggleHabitForDate(prev.habitLogs, habitId, date),
      }))
    },
    [update]
  )

  const setHabitNotes = useCallback(
    async (habitId: string, notes: string, date = getTodayKey()) => {
      await update((prev) => {
        const existing = prev.habitLogs.find((l) => l.habitId === habitId && l.date === date)
        if (existing) {
          return {
            ...prev,
            habitLogs: prev.habitLogs.map((l) =>
              l.habitId === habitId && l.date === date ? { ...l, notes } : l
            ),
          }
        }
        const log: HabitLog = { date, habitId, completed: false, notes }
        return { ...prev, habitLogs: [...prev.habitLogs, log] }
      })
    },
    [update]
  )

  const upsertLead = useCallback(
    async (lead: Partial<BuyerLead> & { buyerName: string; fiverrUsername: string }) => {
      await update((prev) => {
        if (lead.id) {
          return {
            ...prev,
            leads: prev.leads.map((l) =>
              l.id === lead.id
                ? { ...l, ...lead, updatedAt: new Date().toISOString() }
                : l
            ),
          }
        }
        const now = new Date().toISOString()
        const created: BuyerLead = {
          id: newId('lead'),
          buyerName: lead.buyerName,
          fiverrUsername: lead.fiverrUsername,
          projectType: lead.projectType ?? '',
          budget: lead.budget ?? '',
          status: lead.status ?? 'new',
          lastMessageDate: lead.lastMessageDate,
          nextFollowUpDate: lead.nextFollowUpDate,
          notes: lead.notes ?? '',
          customOfferSent: lead.customOfferSent ?? false,
          orderCreated: lead.orderCreated ?? false,
          temperature: lead.temperature ?? 'warm',
          source: lead.source ?? 'inbox',
          createdAt: now,
          updatedAt: now,
        }
        return { ...prev, leads: [created, ...prev.leads] }
      })
    },
    [update]
  )

  const deleteLead = useCallback(
    async (id: string) => {
      await update((prev) => ({ ...prev, leads: prev.leads.filter((l) => l.id !== id) }))
    },
    [update]
  )

  const upsertProof = useCallback(
    async (asset: Partial<ProofAsset> & { title: string; type: ProofAsset['type'] }) => {
      await update((prev) => {
        if (asset.id) {
          return {
            ...prev,
            proofAssets: prev.proofAssets.map((p) => (p.id === asset.id ? { ...p, ...asset } : p)),
          }
        }
        const created: ProofAsset = {
          id: newId('proof'),
          title: asset.title,
          type: asset.type,
          relatedGig: asset.relatedGig ?? '',
          date: asset.date ?? getTodayKey(),
          fileUrl: asset.fileUrl ?? '',
          notes: asset.notes ?? '',
          tags: asset.tags ?? [],
        }
        return { ...prev, proofAssets: [created, ...prev.proofAssets] }
      })
    },
    [update]
  )

  const deleteProof = useCallback(
    async (id: string) => {
      await update((prev) => ({
        ...prev,
        proofAssets: prev.proofAssets.filter((p) => p.id !== id),
      }))
    },
    [update]
  )

  const upsertWeeklyReview = useCallback(
    async (review: Partial<WeeklyReview> & { weekStart: string }) => {
      await update((prev) => {
        if (review.id) {
          return {
            ...prev,
            weeklyReviews: prev.weeklyReviews.map((r) =>
              r.id === review.id ? { ...r, ...review } : r
            ),
          }
        }
        const created: WeeklyReview = {
          id: newId('review'),
          weekStart: review.weekStart,
          improved: review.improved ?? '',
          gotClicks: review.gotClicks ?? '',
          blocked: review.blocked ?? '',
          fixNextWeek: review.fixNextWeek ?? '',
          proofCreated: review.proofCreated ?? '',
          focusNextWeek: review.focusNextWeek ?? '',
          energyScore: review.energyScore ?? 5,
          wins: review.wins ?? '',
          createdAt: new Date().toISOString(),
        }
        return { ...prev, weeklyReviews: [created, ...prev.weeklyReviews] }
      })
    },
    [update]
  )

  const deleteWeeklyReview = useCallback(
    async (id: string) => {
      await update((prev) => ({
        ...prev,
        weeklyReviews: prev.weeklyReviews.filter((review) => review.id !== id),
      }))
    },
    [update]
  )

  const updateSeptemberPlan = useCallback(
    async (plan: Partial<SeptemberScalePlan>) => {
      await update((prev) => ({
        ...prev,
        septemberPlan: {
          ...prev.septemberPlan,
          ...plan,
          updatedAt: new Date().toISOString(),
        },
      }))
    },
    [update]
  )

  const upsertCompetitor = useCallback(
    async (scan: Partial<CompetitorWatch> & { username: string }) => {
      await update((prev) => {
        if (scan.id) {
          return {
            ...prev,
            competitors: prev.competitors.map((c) =>
              c.id === scan.id ? { ...c, ...scan } : c
            ),
          }
        }
        const created: CompetitorWatch = {
          id: newId('comp'),
          username: scan.username,
          niche: scan.niche ?? '',
          rating: scan.rating ?? 0,
          reviews: scan.reviews ?? 0,
          threatLevel: scan.threatLevel ?? 'medium',
          priceRange: scan.priceRange ?? '',
          strengths: scan.strengths ?? '',
          weaknesses: scan.weaknesses ?? '',
          thumbnailNotes: scan.thumbnailNotes ?? '',
          lastChecked: scan.lastChecked ?? getTodayKey(),
          notes: scan.notes ?? '',
        }
        return { ...prev, competitors: [created, ...prev.competitors] }
      })
    },
    [update]
  )

  const deleteCompetitor = useCallback(
    async (id: string) => {
      await update((prev) => ({
        ...prev,
        competitors: prev.competitors.filter((c) => c.id !== id),
      }))
    },
    [update]
  )

  const upsertJournal = useCallback(
    async (entry: Partial<DailyJournalEntry> & { date: string }) => {
      await update((prev) => {
        const journal = prev.journal ?? []
        const existing = journal.find((j) => j.date === entry.date)
        if (existing) {
          return {
            ...prev,
            journal: journal.map((j) =>
              j.date === entry.date ? { ...j, ...entry } : j
            ),
          }
        }
        const created: DailyJournalEntry = {
          id: newId('journal'),
          date: entry.date,
          mood: entry.mood ?? 3,
          energy: entry.energy ?? 3,
          wins: entry.wins ?? '',
          blockers: entry.blockers ?? '',
          tomorrowFocus: entry.tomorrowFocus ?? '',
          notes: entry.notes ?? '',
        }
        return { ...prev, journal: [created, ...journal] }
      })
    },
    [update]
  )

  const upsertSeoKeyword = useCallback(
    async (keyword: Partial<SeoKeyword> & { keyword: string }) => {
      await update((prev) => {
        if (keyword.id) {
          return {
            ...prev,
            seoKeywords: prev.seoKeywords.map((item) =>
              item.id === keyword.id ? { ...item, ...keyword } : item
            ),
          }
        }
        const created: SeoKeyword = {
          id: newId('seo'),
          keyword: keyword.keyword,
          gigId: keyword.gigId,
          gigLane: keyword.gigLane ?? '',
          intent: keyword.intent ?? 'primary',
          status: keyword.status ?? 'research',
          difficulty: keyword.difficulty ?? 5,
          usedInTitle: keyword.usedInTitle ?? false,
          usedInTags: keyword.usedInTags ?? false,
          usedInDescription: keyword.usedInDescription ?? false,
          notes: keyword.notes ?? '',
        }
        return { ...prev, seoKeywords: [created, ...prev.seoKeywords] }
      })
    },
    [update]
  )

  const deleteSeoKeyword = useCallback(
    async (id: string) => {
      await update((prev) => ({
        ...prev,
        seoKeywords: prev.seoKeywords.filter((item) => item.id !== id),
      }))
    },
    [update]
  )

  const resetStore = useCallback(async () => {
    const seed = await resetSprintStore()
    setStore(seed)
  }, [])

  const exportJson = useCallback(() => {
    if (!store) return
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fiverr-growth-sprint-${getTodayKey()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [store])

  return {
    store,
    loading,
    error,
    stats,
    nextAction,
    persist,
    setTaskStatus,
    upsertTask,
    deleteTask,
    updateProfile,
    updateSkill,
    addAnalytics,
    updateAnalytics,
    deleteAnalytics,
    updateGig,
    toggleHabit,
    setHabitNotes,
    upsertLead,
    deleteLead,
    upsertProof,
    deleteProof,
    upsertWeeklyReview,
    deleteWeeklyReview,
    updateSeptemberPlan,
    upsertCompetitor,
    deleteCompetitor,
    upsertJournal,
    upsertSeoKeyword,
    deleteSeoKeyword,
    resetStore,
    exportJson,
  }
}

export type UseSprintStoreReturn = ReturnType<typeof useSprintStore>
