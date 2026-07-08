import type { SprintSectionId, SprintTask, TaskPriority, TaskStatus } from '../types'
import { SPRINT_SECTIONS } from '../types'
import type { TodoistTask } from './types'

/** Todoist API v1 priority: 1 = highest … 4 = lowest */
export function sprintPriorityToTodoist(p: TaskPriority): number {
  return { P1: 1, P2: 2, P3: 3, P4: 4 }[p]
}

export function todoistPriorityToSprint(p: number): TaskPriority {
  if (p <= 1) return 'P1'
  if (p === 2) return 'P2'
  if (p === 3) return 'P3'
  return 'P4'
}

export function isTodoistTaskCompleted(task: TodoistTask): boolean {
  return task.checked === true
}

export function sprintStatusToCompleted(status: TaskStatus): boolean {
  return status === 'done' || status === 'skipped'
}

export function buildTodoistContent(task: SprintTask): string {
  const section = SPRINT_SECTIONS.find((s) => s.id === task.section)
  const prefix = section ? `[${task.section}] ` : ''
  return `${prefix}${task.title}`
}

export function buildTodoistDescription(task: SprintTask): string {
  const lines = [
    task.description,
    task.notes ? `Notes: ${task.notes}` : '',
    task.duration ? `Duration: ${task.duration}` : '',
    task.impact ? `Impact: ${task.impact}` : '',
    task.effort ? `Effort: ${task.effort}` : '',
    `Sprint ID: ${task.id}`,
    `Section: ${task.section}`,
  ].filter(Boolean)
  return lines.join('\n')
}

export function buildTodoistLabels(task: SprintTask): string[] {
  const labels = new Set<string>(['fiverr-sprint', `section-${task.section}`, ...(task.labels ?? [])])
  if (task.priority === 'P1') labels.add('p1-critical')
  return [...labels]
}

export function sprintTaskFromTodoist(
  todoist: TodoistTask,
  sectionId: SprintSectionId,
  existing?: SprintTask
): Partial<SprintTask> {
  const content = todoist.content.replace(/^\[\d{2}\]\s*/, '')
  const status: TaskStatus = isTodoistTaskCompleted(todoist) ? 'done' : existing?.status ?? 'todo'
  const priority = todoistPriorityToSprint(todoist.priority)
  const dueDate = todoist.due?.date

  return {
    id: existing?.id,
    title: content,
    description: todoist.description?.split('\n')[0] ?? existing?.description,
    dueDate: dueDate ?? existing?.dueDate,
    priority,
    section: sectionId,
    status,
    todoistId: todoist.id,
    todoistSyncedAt: new Date().toISOString(),
    labels: todoist.labels?.filter((l) => !l.startsWith('section-') && l !== 'fiverr-sprint'),
    completedAt: isTodoistTaskCompleted(todoist) ? existing?.completedAt ?? new Date().toISOString() : undefined,
    updatedAt: new Date().toISOString(),
  }
}

export function inferSectionFromTodoist(
  todoist: TodoistTask,
  sectionMap: Record<string, string>
): SprintSectionId {
  const reverse = Object.fromEntries(
    Object.entries(sectionMap).map(([sprint, todoistSection]) => [todoistSection, sprint])
  )
  if (todoist.section_id && reverse[todoist.section_id]) {
    return reverse[todoist.section_id] as SprintSectionId
  }
  const labelSection = todoist.labels?.find((l) => l.startsWith('section-'))
  if (labelSection) return labelSection.replace('section-', '') as SprintSectionId
  const match = todoist.content.match(/^\[(\d{2})\]/)
  if (match) return match[1] as SprintSectionId
  return '00'
}

export function sectionNameForTodoist(sectionId: SprintSectionId): string {
  const section = SPRINT_SECTIONS.find((s) => s.id === sectionId)
  return section?.label ?? `Section ${sectionId}`
}
