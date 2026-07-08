export interface TodoistUser {
  id: string
  email: string
  full_name: string
}

export interface TodoistProject {
  id: string
  name: string
  color: string
  is_favorite: boolean
  order: number
}

export interface TodoistSection {
  id: string
  project_id: string
  name: string
  order: number
}

export interface TodoistTask {
  id: string
  project_id: string
  section_id: string | null
  content: string
  description: string
  checked: boolean
  labels: string[]
  priority: number
  due: { date?: string; datetime?: string; string?: string; is_recurring?: boolean; lang?: string } | null
  url?: string
  added_at?: string
  updated_at?: string
  completed_at?: string | null
}

export interface TodoistLabel {
  id: string
  name: string
  color: string
}

export interface TodoistConfig {
  apiKey: string
  projectId?: string
  sectionMap: Record<string, string>
  autoSync: boolean
  syncOnComplete: boolean
  lastSyncAt?: string
  lastSyncStatus?: 'success' | 'error'
  lastSyncMessage?: string
  connected: boolean
}

export interface TodoistSyncResult {
  pushed: number
  pulled: number
  updated: number
  completed: number
  errors: string[]
}
