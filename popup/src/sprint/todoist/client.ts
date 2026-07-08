import type { TodoistLabel, TodoistProject, TodoistSection, TodoistTask, TodoistUser } from './types'

const BASE = 'https://api.todoist.com/api/v1'

interface PaginatedResponse<T> {
  results: T[]
  next_cursor: string | null
}

export class TodoistApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = 'TodoistApiError'
  }
}

export class TodoistClient {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (res.status === 204) return undefined as T

    const text = await res.text()
    let data: unknown = null
    try {
      data = text ? JSON.parse(text) : null
    } catch {
      data = text
    }

    if (!res.ok) {
      const msg =
        typeof data === 'object' && data && 'error' in data
          ? String((data as { error: string }).error)
          : typeof data === 'string'
            ? data
            : res.statusText
      throw new TodoistApiError(msg || `Todoist API error ${res.status}`, res.status)
    }

    return data as T
  }

  private async requestAll<T>(
    path: string,
    params: Record<string, string> = {}
  ): Promise<T[]> {
    const items: T[] = []
    let cursor: string | null = null

    do {
      const qs = new URLSearchParams({ ...params, limit: '200' })
      if (cursor) qs.set('cursor', cursor)
      const page = await this.request<PaginatedResponse<T>>('GET', `${path}?${qs}`)
      items.push(...(page.results ?? []))
      cursor = page.next_cursor
    } while (cursor)

    return items
  }

  getUser() {
    return this.request<TodoistUser>('GET', '/user')
  }

  getProjects() {
    return this.requestAll<TodoistProject>('/projects')
  }

  getProject(projectId: string) {
    return this.request<TodoistProject>('GET', `/projects/${projectId}`)
  }

  createProject(name: string, color = 'green') {
    return this.request<TodoistProject>('POST', '/projects', { name, color })
  }

  getSections(projectId: string) {
    return this.requestAll<TodoistSection>('/sections', { project_id: projectId })
  }

  createSection(projectId: string, name: string) {
    return this.request<TodoistSection>('POST', '/sections', { project_id: projectId, name })
  }

  getTasks(projectId?: string) {
    const params: Record<string, string> = {}
    if (projectId) params.project_id = projectId
    return this.requestAll<TodoistTask>('/tasks', params)
  }

  getTask(id: string) {
    return this.request<TodoistTask>('GET', `/tasks/${id}`)
  }

  createTask(payload: {
    content: string
    description?: string
    project_id?: string
    section_id?: string
    due_date?: string
    priority?: number
    labels?: string[]
  }) {
    return this.request<TodoistTask>('POST', '/tasks', payload)
  }

  updateTask(
    id: string,
    payload: Partial<{
      content: string
      description: string
      due_date: string | null
      priority: number
      labels: string[]
      section_id: string | null
    }>
  ) {
    return this.request<TodoistTask>('POST', `/tasks/${id}`, payload)
  }

  closeTask(id: string) {
    return this.request<void>('POST', `/tasks/${id}/close`)
  }

  reopenTask(id: string) {
    return this.request<void>('POST', `/tasks/${id}/reopen`)
  }

  deleteTask(id: string) {
    return this.request<void>('DELETE', `/tasks/${id}`)
  }

  getLabels() {
    return this.requestAll<TodoistLabel>('/labels')
  }
}
