import type { SprintSectionId, SprintStore, SprintTask } from '../types'
import { SPRINT_SECTIONS, SPRINT_TITLE } from '../types'
import { TodoistClient } from './client'
import type { TodoistConfig, TodoistSyncResult } from './types'
import {
  buildTodoistContent,
  buildTodoistDescription,
  buildTodoistLabels,
  inferSectionFromTodoist,
  isTodoistTaskCompleted,
  sectionNameForTodoist,
  sprintPriorityToTodoist,
  sprintStatusToCompleted,
  sprintTaskFromTodoist,
} from './mapping'
import { newId } from '../utils'

export async function verifyTodoistConnection(apiKey: string) {
  const client = new TodoistClient(apiKey)
  const user = await client.getUser()
  return { client, user }
}

export async function ensureTodoistProject(client: TodoistClient, config: TodoistConfig): Promise<string> {
  if (config.projectId) {
    try {
      await client.getProject(config.projectId)
      return config.projectId
    } catch {
      // fall through to recreate
    }
  }

  const projects = await client.getProjects()
  const existing = projects.find(
    (p) => p.name === SPRINT_TITLE || p.name.includes('Fiverr Growth Sprint')
  )
  if (existing) return existing.id

  const created = await client.createProject(SPRINT_TITLE, 'green')
  return created.id
}

export async function ensureTodoistSections(
  client: TodoistClient,
  projectId: string,
  existingMap: Record<string, string>
): Promise<Record<string, string>> {
  const sections = await client.getSections(projectId)
  const map: Record<string, string> = { ...existingMap }

  for (const section of SPRINT_SECTIONS) {
    if (map[section.id]) {
      const found = sections.find((s) => s.id === map[section.id])
      if (found) continue
    }

    const byName = sections.find(
      (s) => s.name === sectionNameForTodoist(section.id) || s.name.includes(section.shortLabel)
    )
    if (byName) {
      map[section.id] = byName.id
      continue
    }

    const created = await client.createSection(projectId, sectionNameForTodoist(section.id))
    map[section.id] = created.id
  }

  return map
}

export async function pushSprintToTodoist(
  store: SprintStore,
  config: TodoistConfig
): Promise<{ store: SprintStore; config: TodoistConfig; result: TodoistSyncResult }> {
  const client = new TodoistClient(config.apiKey)
  const result: TodoistSyncResult = { pushed: 0, pulled: 0, updated: 0, completed: 0, errors: [] }

  const projectId = await ensureTodoistProject(client, config)
  const sectionMap = await ensureTodoistSections(client, projectId, config.sectionMap)
  const remoteTasks = await client.getTasks(projectId)
  const remoteById = new Map(remoteTasks.map((t) => [t.id, t]))

  const tasks = [...store.tasks]

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i]
    try {
      const sectionId = sectionMap[task.section] ?? null
      const payload = {
        content: buildTodoistContent(task),
        description: buildTodoistDescription(task),
        project_id: projectId,
        section_id: sectionId,
        due_date: task.dueDate,
        priority: sprintPriorityToTodoist(task.priority),
        labels: buildTodoistLabels(task),
      }

      if (task.todoistId && remoteById.has(task.todoistId)) {
        await client.updateTask(task.todoistId, payload)
        if (sprintStatusToCompleted(task.status)) {
          await client.closeTask(task.todoistId)
          result.completed++
        } else if (remoteById.get(task.todoistId) && isTodoistTaskCompleted(remoteById.get(task.todoistId)!)) {
          await client.reopenTask(task.todoistId)
        }
        tasks[i] = { ...task, todoistSyncedAt: new Date().toISOString() }
        result.updated++
      } else {
        const created = await client.createTask(payload)
        if (sprintStatusToCompleted(task.status)) {
          await client.closeTask(created.id)
          result.completed++
        }
        tasks[i] = {
          ...task,
          todoistId: created.id,
          todoistSyncedAt: new Date().toISOString(),
        }
        result.pushed++
      }
    } catch (e) {
      result.errors.push(`${task.title}: ${e instanceof Error ? e.message : 'sync failed'}`)
    }
  }

  const nextConfig: TodoistConfig = {
    ...config,
    projectId,
    sectionMap,
    lastSyncAt: new Date().toISOString(),
    lastSyncStatus: result.errors.length ? 'error' : 'success',
    lastSyncMessage:
      result.errors.length > 0
        ? `${result.pushed + result.updated} synced, ${result.errors.length} errors`
        : `Pushed ${result.pushed} new, updated ${result.updated}`,
  }

  return {
    store: { ...store, tasks, lastUpdated: new Date().toISOString() },
    config: nextConfig,
    result,
  }
}

export async function pullTodoistToSprint(
  store: SprintStore,
  config: TodoistConfig
): Promise<{ store: SprintStore; config: TodoistConfig; result: TodoistSyncResult }> {
  const client = new TodoistClient(config.apiKey)
  const result: TodoistSyncResult = { pushed: 0, pulled: 0, updated: 0, completed: 0, errors: [] }

  const projectId = await ensureTodoistProject(client, config)
  const sectionMap = await ensureTodoistSections(client, projectId, config.sectionMap)
  const remoteTasks = await client.getTasks(projectId)

  const byTodoistId = new Map(store.tasks.filter((t) => t.todoistId).map((t) => [t.todoistId!, t]))
  const byLocalId = new Map(store.tasks.map((t) => [t.id, t]))
  const tasks = [...store.tasks]
  const seenTodoist = new Set<string>()

  for (const remote of remoteTasks) {
    seenTodoist.add(remote.id)
    const existing = byTodoistId.get(remote.id)
    const section = inferSectionFromTodoist(remote, sectionMap) as SprintSectionId
    const partial = sprintTaskFromTodoist(remote, section, existing)

    if (existing) {
      const idx = tasks.findIndex((t) => t.id === existing.id)
      if (idx >= 0) {
        tasks[idx] = {
          ...existing,
          ...partial,
          id: existing.id,
          createdAt: existing.createdAt,
        } as SprintTask
        result.updated++
      }
    } else {
      const sprintIdMatch = remote.description?.match(/Sprint ID: ([\w-]+)/)
      const localMatch = sprintIdMatch ? byLocalId.get(sprintIdMatch[1]) : undefined

      if (localMatch) {
        const idx = tasks.findIndex((t) => t.id === localMatch.id)
        tasks[idx] = {
          ...localMatch,
          ...partial,
          id: localMatch.id,
          todoistId: remote.id,
          createdAt: localMatch.createdAt,
        } as SprintTask
        result.updated++
      } else {
        const created: SprintTask = {
          id: newId('t'),
          title: partial.title ?? remote.content,
          description: partial.description,
          dueDate: partial.dueDate,
          priority: partial.priority ?? 'P3',
          section,
          status: partial.status ?? 'todo',
          labels: partial.labels,
          todoistId: remote.id,
          todoistSyncedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          completedAt: partial.completedAt,
        }
        tasks.push(created)
        result.pulled++
      }
    }

    if (isTodoistTaskCompleted(remote)) result.completed++
  }

  // API v1 active-task list excludes completed items — treat missing linked tasks as done.
  const activeRemoteIds = new Set(remoteTasks.map((t) => t.id))
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i]
    if (
      task.todoistId &&
      !activeRemoteIds.has(task.todoistId) &&
      task.status !== 'done' &&
      task.status !== 'skipped'
    ) {
      tasks[i] = {
        ...task,
        status: 'done',
        completedAt: task.completedAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        todoistSyncedAt: new Date().toISOString(),
      }
      result.completed++
      result.updated++
    }
  }

  const nextConfig: TodoistConfig = {
    ...config,
    projectId,
    sectionMap,
    lastSyncAt: new Date().toISOString(),
    lastSyncStatus: result.errors.length ? 'error' : 'success',
    lastSyncMessage: `Pulled ${result.pulled} new, updated ${result.updated} from Todoist`,
  }

  return {
    store: { ...store, tasks, lastUpdated: new Date().toISOString() },
    config: nextConfig,
    result,
  }
}

export async function syncBidirectional(
  store: SprintStore,
  config: TodoistConfig
): Promise<{ store: SprintStore; config: TodoistConfig; result: TodoistSyncResult }> {
  const push = await pushSprintToTodoist(store, config)
  const pull = await pullTodoistToSprint(push.store, push.config)

  return {
    store: pull.store,
    config: pull.config,
    result: {
      pushed: push.result.pushed,
      pulled: pull.result.pulled,
      updated: push.result.updated + pull.result.updated,
      completed: push.result.completed + pull.result.completed,
      errors: [...push.result.errors, ...pull.result.errors],
    },
  }
}

export async function syncSingleTaskToTodoist(
  task: SprintTask,
  config: TodoistConfig
): Promise<{ task: SprintTask; config: TodoistConfig }> {
  if (!config.apiKey) return { task, config }

  const client = new TodoistClient(config.apiKey)
  const projectId = await ensureTodoistProject(client, config)
  const sectionMap = await ensureTodoistSections(client, projectId, config.sectionMap)
  const sectionId = sectionMap[task.section] ?? null

  const payload = {
    content: buildTodoistContent(task),
    description: buildTodoistDescription(task),
    project_id: projectId,
    section_id: sectionId,
    due_date: task.dueDate,
    priority: sprintPriorityToTodoist(task.priority),
    labels: buildTodoistLabels(task),
  }

  let todoistId = task.todoistId
  if (todoistId) {
    await client.updateTask(todoistId, payload)
    if (sprintStatusToCompleted(task.status)) {
      await client.closeTask(todoistId)
    } else {
      try {
        const remote = await client.getTask(todoistId)
        if (isTodoistTaskCompleted(remote)) await client.reopenTask(todoistId)
      } catch {
        // task may have been deleted remotely
        todoistId = undefined
      }
    }
  }

  if (!todoistId) {
    const created = await client.createTask(payload)
    todoistId = created.id
    if (sprintStatusToCompleted(task.status)) await client.closeTask(todoistId)
  }

  return {
    task: { ...task, todoistId, todoistSyncedAt: new Date().toISOString() },
    config: { ...config, projectId, sectionMap },
  }
}
