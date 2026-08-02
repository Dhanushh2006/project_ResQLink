
import { db, persist, uid, now } from '../db';
import { publish } from '../bus';
import { audit } from '../audit';
import type { Alert, CoordinationGap, GapType, Severity } from '../types';
import type { Actor } from './incidents';

// ---------------- Alerts ----------------

export function listAlerts(): Alert[] {
  return [...db().alerts].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export interface RaiseAlertInput {
  title: string;
  detail: string;
  severity: Severity;
  incidentId?: string | null;
  rule: string;
}

export function raiseAlert(input: RaiseAlertInput): Alert {
  // de-dupe identical open alerts for same incident+rule
  const existing = db().alerts.find(
    (a) => a.status === 'OPEN' && a.rule === input.rule && a.incidentId === (input.incidentId ?? null) && a.title === input.title,
  );
  if (existing) return existing;
  const a: Alert = {
    id: uid('alr'),
    title: input.title,
    detail: input.detail,
    severity: input.severity,
    incidentId: input.incidentId ?? null,
    status: 'OPEN',
    rule: input.rule,
    createdAt: now(),
  };
  db().alerts.unshift(a);
  persist();
  publish('alert', 'created', { id: a.id, data: a });
  return a;
}

export function resolveAlert(id: string, actor: Actor): Alert {
  const a = db().alerts.find((x) => x.id === id);
  if (!a) throw new Error('Alert not found');
  a.status = 'RESOLVED';
  persist();
  publish('alert', 'updated', { id: a.id, data: a });
  audit({
    userId: actor.id,
    userName: actor.name,
    role: actor.role,
    action: 'ALERT_RESOLVE',
    entityType: 'alert',
    entityId: a.id,
    incidentId: a.incidentId,
    toState: 'RESOLVED',
    detail: a.title,
  });
  return a;
}

export function acknowledgeAlert(id: string, actor: Actor): Alert {
  const a = db().alerts.find((x) => x.id === id);
  if (!a) throw new Error('Alert not found');
  a.status = 'ACKNOWLEDGED';
  persist();
  publish('alert', 'updated', { id: a.id, data: a });
  audit({
    userId: actor.id,
    userName: actor.name,
    role: actor.role,
    action: 'ALERT_ACK',
    entityType: 'alert',
    entityId: a.id,
    incidentId: a.incidentId,
    toState: 'ACKNOWLEDGED',
    detail: a.title,
  });
  return a;
}

// ---------------- Coordination Gaps ----------------

export function listGaps(includeResolved = false): CoordinationGap[] {
  return db()
    .coordinationGaps.filter((g) => includeResolved || !g.resolved)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export interface GapInput {
  type: GapType;
  title: string;
  detail: string;
  incidentId?: string | null;
  severity: Severity;
  suggestedAction: string;
  elapsedRef?: string | null;
  dedupeKey?: string;
}

export function raiseGap(input: GapInput): CoordinationGap {
  const key = input.dedupeKey || `${input.type}:${input.incidentId ?? ''}:${input.title}`;
  const existing = db().coordinationGaps.find(
    (g) => !g.resolved && `${g.type}:${g.incidentId ?? ''}:${g.title}` === key,
  );
  if (existing) return existing;
  const g: CoordinationGap = {
    id: uid('gap'),
    type: input.type,
    title: input.title,
    detail: input.detail,
    incidentId: input.incidentId ?? null,
    severity: input.severity,
    suggestedAction: input.suggestedAction,
    elapsedRef: input.elapsedRef ?? null,
    resolved: false,
    createdAt: now(),
  };
  db().coordinationGaps.unshift(g);
  persist();
  publish('gap', 'created', { id: g.id, data: g });
  return g;
}

export function resolveGap(id: string, actor: Actor): CoordinationGap {
  const g = db().coordinationGaps.find((x) => x.id === id);
  if (!g) throw new Error('Gap not found');
  g.resolved = true;
  persist();
  publish('gap', 'updated', { id: g.id, data: g });
  audit({
    userId: actor.id,
    userName: actor.name,
    role: actor.role,
    action: 'GAP_RESOLVE',
    entityType: 'gap',
    entityId: g.id,
    incidentId: g.incidentId,
    toState: 'RESOLVED',
    detail: g.title,
  });
  return g;
}
