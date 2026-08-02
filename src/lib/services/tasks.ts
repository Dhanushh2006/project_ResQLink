// Task lifecycle: create, assign, acknowledge, progress, complete,
// reassign, plus overdue detection.

import { db, persist, uid, code, now } from '../db';
import { publish } from '../bus';
import { audit } from '../audit';
import type { Priority, Task, TaskStatus } from '../types';
import type { Actor } from './incidents';
import { addUpdate } from './incidents';

export function listTasks(): Task[] {
  return [...db().tasks].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export function getTask(id: string): Task | undefined {
  return db().tasks.find((t) => t.id === id);
}

export function tasksForIncident(incidentId: string): Task[] {
  return db().tasks.filter((t) => t.incidentId === incidentId);
}

export interface CreateTaskInput {
  incidentId: string;
  title: string;
  description: string;
  agencyId?: string | null;
  resourceId?: string | null;
  priority: Priority;
  locationName: string;
  deadline?: string | null;
}

export function createTask(input: CreateTaskInput, actor: Actor): Task {
  const t: Task = {
    id: code('TSK', 100 + db().tasks.length + Math.floor(Math.random() * 800)),
    incidentId: input.incidentId,
    title: input.title,
    description: input.description,
    agencyId: input.agencyId ?? null,
    resourceId: input.resourceId ?? null,
    priority: input.priority,
    locationName: input.locationName,
    status: input.agencyId ? 'ASSIGNED' : 'PENDING',
    deadline: input.deadline ?? null,
    createdAt: now(),
    updatedAt: now(),
  };
  db().tasks.unshift(t);
  persist();
  publish('task', 'created', { id: t.id, data: t });
  addUpdate(input.incidentId, {
    authorId: actor.id,
    authorName: actor.name,
    kind: 'NOTE',
    message: `Task created: ${t.title} [${t.priority}]`,
  });
  audit({
    userId: actor.id,
    userName: actor.name,
    role: actor.role,
    action: 'TASK_CREATE',
    entityType: 'task',
    entityId: t.id,
    incidentId: t.incidentId,
    toState: t.status,
    detail: t.title,
  });
  return t;
}

const ALLOWED: Record<TaskStatus, TaskStatus[]> = {
  PENDING: ['ASSIGNED'],
  ASSIGNED: ['ACKNOWLEDGED', 'IN_PROGRESS', 'BLOCKED', 'PENDING'],
  ACKNOWLEDGED: ['IN_PROGRESS', 'BLOCKED'],
  IN_PROGRESS: ['COMPLETED', 'BLOCKED'],
  BLOCKED: ['IN_PROGRESS', 'ASSIGNED'],
  COMPLETED: [],
};

export function setTaskStatus(id: string, to: TaskStatus, actor: Actor): Task {
  const t = getTask(id);
  if (!t) throw new Error('Task not found');
  const from = t.status;
  if (from !== to && !ALLOWED[from]?.includes(to)) {
    throw new Error(`Invalid task transition ${from} → ${to}`);
  }
  t.status = to;
  t.updatedAt = now();
  persist();
  publish('task', 'updated', { id: t.id, data: t });
  audit({
    userId: actor.id,
    userName: actor.name,
    role: actor.role,
    action: 'TASK_STATUS',
    entityType: 'task',
    entityId: t.id,
    incidentId: t.incidentId,
    fromState: from,
    toState: to,
    detail: t.title,
  });
  return t;
}

export function assignTask(id: string, agencyId: string, actor: Actor): Task {
  const t = getTask(id);
  if (!t) throw new Error('Task not found');
  t.agencyId = agencyId;
  t.status = 'ASSIGNED';
  t.updatedAt = now();
  persist();
  publish('task', 'updated', { id: t.id, data: t });
  audit({
    userId: actor.id,
    userName: actor.name,
    role: actor.role,
    action: 'TASK_ASSIGN',
    entityType: 'task',
    entityId: t.id,
    incidentId: t.incidentId,
    toState: 'ASSIGNED',
    detail: `${t.title} → ${agencyId}`,
  });
  return t;
}

export function isOverdue(t: Task): boolean {
  if (!t.deadline || t.status === 'COMPLETED') return false;
  return +new Date(t.deadline) < Date.now();
}

export function overdueTasks(): Task[] {
  return db().tasks.filter(isOverdue);
}
