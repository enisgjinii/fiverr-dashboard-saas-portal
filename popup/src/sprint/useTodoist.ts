import { useCallback, useEffect, useState } from 'react'
import type { SprintStore, SprintTask } from './types'
import {
  clearTodoistConfig,
  loadTodoistConfig,
  pullTodoistToSprint,
  pushSprintToTodoist,
  saveTodoistConfig,
  syncBidirectional,
  syncSingleTaskToTodoist,
  verifyTodoistConnection,
  type TodoistConfig,
  type TodoistSyncResult,
  type TodoistUser,
} from './todoist'

export function useTodoist(store: SprintStore | null, persistStore: (next: SprintStore) => Promise<void>) {
  const [config, setConfig] = useState<TodoistConfig | null>(null)
  const [user, setUser] = useState<TodoistUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [lastResult, setLastResult] = useState<TodoistSyncResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTodoistConfig()
      .then(async (cfg) => {
        setConfig(cfg)
        if (cfg.apiKey && cfg.connected) {
          try {
            const { user: u } = await verifyTodoistConnection(cfg.apiKey)
            setUser(u)
          } catch {
            setUser(null)
          }
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const connect = useCallback(
    async (apiKey: string) => {
      setError(null)
      setSyncing(true)
      try {
        const { user: u } = await verifyTodoistConnection(apiKey.trim())
        const next: TodoistConfig = {
          ...(config ?? {
            sectionMap: {},
            autoSync: true,
            syncOnComplete: true,
            connected: false,
          }),
          apiKey: apiKey.trim(),
          connected: true,
        }
        await saveTodoistConfig(next)
        setConfig(next)
        setUser(u)
        return true
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Connection failed')
        return false
      } finally {
        setSyncing(false)
      }
    },
    [config]
  )

  const disconnect = useCallback(async () => {
    await clearTodoistConfig()
    setConfig({ apiKey: '', sectionMap: {}, autoSync: true, syncOnComplete: true, connected: false })
    setUser(null)
    setLastResult(null)
    setError(null)
  }, [])

  const updateConfig = useCallback(async (patch: Partial<TodoistConfig>) => {
    const next = { ...(config ?? { apiKey: '', sectionMap: {}, autoSync: true, syncOnComplete: true, connected: false }), ...patch }
    await saveTodoistConfig(next)
    setConfig(next)
  }, [config])

  const runSync = useCallback(
    async (mode: 'push' | 'pull' | 'both') => {
      if (!store || !config?.apiKey) return null
      setSyncing(true)
      setError(null)
      try {
        let outcome
        if (mode === 'push') outcome = await pushSprintToTodoist(store, config)
        else if (mode === 'pull') outcome = await pullTodoistToSprint(store, config)
        else outcome = await syncBidirectional(store, config)

        await persistStore(outcome.store)
        await saveTodoistConfig(outcome.config)
        setConfig(outcome.config)
        setLastResult(outcome.result)
        return outcome.result
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Sync failed'
        setError(msg)
        return null
      } finally {
        setSyncing(false)
      }
    },
    [store, config, persistStore]
  )

  const syncTask = useCallback(
    async (task: SprintTask) => {
      if (!store || !config?.apiKey || !config.syncOnComplete) return task
      try {
        const { task: synced, config: nextConfig } = await syncSingleTaskToTodoist(task, config)
        await saveTodoistConfig(nextConfig)
        setConfig(nextConfig)
        await persistStore({
          ...store,
          tasks: store.tasks.map((t) => (t.id === task.id ? synced : t)),
          lastUpdated: new Date().toISOString(),
        })
        return synced
      } catch (e) {
        console.error('Todoist task sync failed', e)
        return task
      }
    },
    [store, config, persistStore]
  )

  const syncedCount = store?.tasks.filter((t: SprintTask) => t.todoistId).length ?? 0
  const unsyncedCount = (store?.tasks.length ?? 0) - syncedCount

  return {
    config,
    user,
    loading,
    syncing,
    error,
    lastResult,
    connected: !!config?.connected && !!config?.apiKey,
    syncedCount,
    unsyncedCount,
    connect,
    disconnect,
    updateConfig,
    runSync,
    syncTask,
  }
}
