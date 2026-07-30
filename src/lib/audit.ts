// Every significant action is recorded with actor, role, entity,
// state transition, and any linked AI recommendation.

import { db, persist, uid, now } from './db';
import { publish } from './bus';
import type { AuditEvent, Role } from './types';

export interface AuditInput {
  userId: string | null;
  userName: string;
  role: Role | 'SYSTEM';
  action: string;
  entityType: string;
  entityId?: string | null;
  incidentId?: string | null;
  fromState?: string | null;
  toState?: string | null;
  aiRecommendationId?: string | null;
  detail?: string;
}

export function audit(input: AuditInput): AuditEvent {
  const event: AuditEvent = {
    id: uid('aud'),
    userId: input.userId,
    userName: input.userName,
    role: input.role,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    incidentId: input.incidentId ?? null,
    fromState: input.fromState ?? null,
    toState: input.toState ?? null,
    aiRecommendationId: input.aiRecommendationId ?? null,
    detail: input.detail ?? '',
    createdAt: now(),
  };
  db().auditEvents.unshift(event);
  // cap growth
  if (db().auditEvents.length > 2000) db().auditEvents.length = 2000;
  persist();
  publish('audit', 'created', { id: event.id, data: event });
  return event;
}
