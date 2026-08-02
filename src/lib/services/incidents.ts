// Incident lifecycle, updates/timeline, and status transitions.

import { db, persist, uid, code, now } from '../db';
import { publish } from '../bus';
import { audit } from '../audit';
import { getProvider } from '../ai';
import type {
  Incident,
  IncidentStatus,
  IncidentType,
  IncidentUpdate,
  Severity,
} from '../types';

export interface Actor {
  id: string | null;
  name: string;
  role: any;
}

const SYSTEM: Actor = { id: null, name: 'ResQLink System', role: 'SYSTEM' };

export function listIncidents(): Incident[] {
  return [...db().incidents].sort(
    (a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt),
  );
}

export function getIncident(id: string): Incident | undefined {
  return db().incidents.find((i) => i.id === id || codeMatch(i, id));
}

function codeMatch(i: Incident, id: string): boolean {
  return i.id.toLowerCase() === id.toLowerCase();
}

export function getUpdates(incidentId: string): IncidentUpdate[] {
  return db()
    .incidentUpdates.filter((u) => u.incidentId === incidentId)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export function addUpdate(
  incidentId: string,
  update: Omit<IncidentUpdate, 'id' | 'incidentId' | 'createdAt'>,
): IncidentUpdate {
  const u: IncidentUpdate = {
    id: uid('upd'),
    incidentId,
    createdAt: now(),
    ...update,
  };
  db().incidentUpdates.unshift(u);
  const inc = getIncident(incidentId);
  if (inc) {
    inc.updatedAt = u.createdAt;
  }
  persist();
  publish('incident_update', 'created', { id: u.id, data: u });
  publish('incident', 'updated', { id: incidentId });
  return u;
}

export interface CreateIncidentInput {
  title: string;
  type: IncidentType;
  severity: Severity;
  description: string;
  source: string;
  locationName: string;
  lat: number;
  lng: number;
  affectedPopulation?: number;
  agencyIds?: string[];
  requiredResourceTypes?: any[];
  commanderId?: string | null;
  status?: IncidentStatus;
  fromReportId?: string;
}

export function createIncident(input: CreateIncidentInput, actor: Actor = SYSTEM): Incident {
  const id = code('INC', 1000 + db().incidents.length + Math.floor(Math.random() * 900));
  const inc: Incident = {
    id,
    title: input.title,
    type: input.type,
    severity: input.severity,
    status: input.status ?? 'DETECTED',
    description: input.description,
    source: input.source,
    locationName: input.locationName,
    lat: input.lat,
    lng: input.lng,
    affectedPopulation: input.affectedPopulation ?? 0,
    agencyIds: input.agencyIds ?? [],
    requiredResourceTypes: input.requiredResourceTypes ?? [],
    commanderId: input.commanderId ?? null,
    escalated: false,
    detectedAt: now(),
    updatedAt: now(),
    resolvedAt: null,
  };
  db().incidents.unshift(inc);
  persist();
  publish('incident', 'created', { id: inc.id, data: inc });
  addUpdate(inc.id, {
    authorId: actor.id,
    authorName: actor.name,
    kind: 'SYSTEM',
    message: `Incident created (${inc.status}) from source: ${inc.source}`,
  });
  audit({
    userId: actor.id,
    userName: actor.name,
    role: actor.role,
    action: 'INCIDENT_CREATE',
    entityType: 'incident',
    entityId: inc.id,
    incidentId: inc.id,
    toState: inc.status,
    detail: `${inc.severity} ${inc.type} — ${inc.title}`,
  });
  return inc;
}

const ALLOWED: Record<IncidentStatus, IncidentStatus[]> = {
  DETECTED: ['VERIFICATION_REQUIRED', 'VERIFIED', 'ACTIVE', 'ARCHIVED'],
  VERIFICATION_REQUIRED: ['VERIFIED', 'ACTIVE', 'ARCHIVED'],
  VERIFIED: ['ACTIVE', 'ESCALATED', 'ARCHIVED'],
  ACTIVE: ['ESCALATED', 'STABILIZING', 'RESOLVED'],
  ESCALATED: ['STABILIZING', 'ACTIVE', 'RESOLVED'],
  STABILIZING: ['RESOLVED', 'ESCALATED', 'ACTIVE'],
  RESOLVED: ['ARCHIVED', 'ACTIVE'],
  ARCHIVED: [],
};

export function canTransition(from: IncidentStatus, to: IncidentStatus): boolean {
  return from === to || ALLOWED[from]?.includes(to);
}

export function setStatus(
  incidentId: string,
  to: IncidentStatus,
  actor: Actor,
  note?: string,
): Incident {
  const inc = getIncident(incidentId);
  if (!inc) throw new Error('Incident not found');
  const from = inc.status;
  if (!canTransition(from, to)) {
    throw new Error(`Invalid transition ${from} → ${to}`);
  }
  inc.status = to;
  inc.updatedAt = now();
  if (to === 'RESOLVED') inc.resolvedAt = now();
  if (to === 'ESCALATED') inc.escalated = true;
  persist();
  addUpdate(incidentId, {
    authorId: actor.id,
    authorName: actor.name,
    kind: 'STATUS',
    message: note || `Status changed ${from} → ${to}`,
    fromStatus: from,
    toStatus: to,
  });
  audit({
    userId: actor.id,
    userName: actor.name,
    role: actor.role,
    action: 'INCIDENT_STATUS',
    entityType: 'incident',
    entityId: inc.id,
    incidentId: inc.id,
    fromState: from,
    toState: to,
    detail: note || '',
  });
  publish('incident', 'updated', { id: inc.id, data: inc });
  return inc;
}

export function setSeverity(incidentId: string, sev: Severity, actor: Actor, reason?: string): Incident {
  const inc = getIncident(incidentId);
  if (!inc) throw new Error('Incident not found');
  const from = inc.severity;
  inc.severity = sev;
  inc.updatedAt = now();
  persist();
  addUpdate(incidentId, {
    authorId: actor.id,
    authorName: actor.name,
    kind: 'NOTE',
    message: `Severity ${from} → ${sev}${reason ? `: ${reason}` : ''}`,
  });
  audit({
    userId: actor.id,
    userName: actor.name,
    role: actor.role,
    action: 'INCIDENT_SEVERITY',
    entityType: 'incident',
    entityId: inc.id,
    incidentId: inc.id,
    fromState: from,
    toState: sev,
    detail: reason || '',
  });
  publish('incident', 'updated', { id: inc.id, data: inc });
  return inc;
}

export function updateIncidentFields(
  incidentId: string,
  patch: Partial<Pick<Incident, 'title' | 'description' | 'agencyIds' | 'requiredResourceTypes' | 'affectedPopulation' | 'commanderId' | 'locationName'>>,
  actor: Actor,
): Incident {
  const inc = getIncident(incidentId);
  if (!inc) throw new Error('Incident not found');
  Object.assign(inc, patch);
  inc.updatedAt = now();
  persist();
  publish('incident', 'updated', { id: inc.id, data: inc });
  audit({
    userId: actor.id,
    userName: actor.name,
    role: actor.role,
    action: 'INCIDENT_UPDATE',
    entityType: 'incident',
    entityId: inc.id,
    incidentId: inc.id,
    detail: Object.keys(patch).join(', '),
  });
  return inc;
}

export async function generateAiSummary(incidentId: string): Promise<string> {
  const inc = getIncident(incidentId);
  if (!inc) throw new Error('Incident not found');
  const updates = getUpdates(incidentId).map((u) => u.message);
  const summary = await getProvider().summarizeIncident({
    title: inc.title,
    description: inc.description,
    updates,
  });
  inc.aiSummary = summary;
  persist();
  publish('incident', 'updated', { id: inc.id });
  return summary;
}
