import type { TodoistConfig } from './types'

const STORAGE_KEY = 'todoistSprintConfig'

const DEFAULT_CONFIG: TodoistConfig = {
  apiKey: '',
  sectionMap: {},
  autoSync: true,
  syncOnComplete: true,
  connected: false,
}

declare const chrome: {
  storage: {
    local: {
      get: (k: string | string[]) => Promise<Record<string, unknown>>
      set: (i: Record<string, unknown>) => Promise<void>
      remove: (k: string | string[]) => Promise<void>
    }
  }
}

function hasChromeStorage(): boolean {
  return typeof chrome !== 'undefined' && !!chrome?.storage?.local
}

export async function loadTodoistConfig(): Promise<TodoistConfig> {
  try {
    if (hasChromeStorage()) {
      const result = await chrome.storage.local.get(STORAGE_KEY)
      const stored = result[STORAGE_KEY] as TodoistConfig | undefined
      if (stored?.apiKey) return { ...DEFAULT_CONFIG, ...stored }
    } else {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
    }
  } catch (e) {
    console.error('Failed to load Todoist config', e)
  }
  return { ...DEFAULT_CONFIG }
}

export async function saveTodoistConfig(config: TodoistConfig): Promise<void> {
  const payload = { ...config, connected: !!config.apiKey }
  if (hasChromeStorage()) {
    await chrome.storage.local.set({ [STORAGE_KEY]: payload })
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }
}

export async function clearTodoistConfig(): Promise<void> {
  if (hasChromeStorage()) {
    await chrome.storage.local.remove(STORAGE_KEY)
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

export function maskApiKey(key: string): string {
  if (!key || key.length < 12) return '••••••••'
  return `${key.slice(0, 6)}••••${key.slice(-4)}`
}
