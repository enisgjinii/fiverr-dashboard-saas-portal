import type { SprintStore } from './types'
import { createSeedStore } from './seed'

declare const chrome: {
  storage: {
    local: {
      get: (k: string | string[]) => Promise<Record<string, unknown>>
      set: (i: Record<string, unknown>) => Promise<void>
    }
  }
}

const STORAGE_KEY = 'fiverrGrowthSprintStore'

function hasChromeStorage(): boolean {
  return typeof chrome !== 'undefined' && !!chrome?.storage?.local
}

export async function loadSprintStore(): Promise<SprintStore> {
  try {
    if (hasChromeStorage()) {
      const result = await chrome.storage.local.get(STORAGE_KEY)
      const stored = result[STORAGE_KEY] as SprintStore | undefined
      if (stored?.version === 2 && Array.isArray(stored.tasks)) {
        return stored
      }
    } else {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const stored = JSON.parse(raw) as SprintStore
        if (stored?.version === 2 && Array.isArray(stored.tasks)) return stored
      }
    }
  } catch (error) {
    console.error('Failed to load sprint store', error)
  }
  const seed = createSeedStore()
  await saveSprintStore(seed)
  return seed
}

export async function saveSprintStore(store: SprintStore): Promise<void> {
  const payload = { ...store, lastUpdated: new Date().toISOString() }
  try {
    if (hasChromeStorage()) {
      await chrome.storage.local.set({ [STORAGE_KEY]: payload })
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    }
  } catch (error) {
    console.error('Failed to save sprint store', error)
  }
}

export async function resetSprintStore(): Promise<SprintStore> {
  const seed = createSeedStore()
  await saveSprintStore(seed)
  return seed
}
