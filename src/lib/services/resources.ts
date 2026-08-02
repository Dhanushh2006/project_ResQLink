// Resource inventory, assignment with conflict prevention, and
// nearest-available selection support for the Resource Agent.

import { db, persist, now } from '../db';
import { publish } from '../bus';
import { audit } from '../audit';
import { haversineKm } from '../geo';
import type { Resource, ResourceStatus, ResourceType } from '../types';
import type { Actor } from './incidents';
import { getIncident, addUpdate } from './incidents';

export function listResources(): Resource[] {
  return [...db().resources];
}

export function getResource(id: string): Resource | undefined {
  return db().resources.find((r) => r.id === id);
}

export function availableResources(): Resource[] {
  return db().resources.filter((r) => r.status === 'AVAILABLE');
}

export interface NearAvailable {
  id: string;
  label: string;
  type: ResourceType;
  distanceKm: number;
}

export function nearestAvailable(
  lat: number,
  lng: number,
  types?: ResourceType[],
): NearAvailable[] {
  return db()
    .resources.filter(
      (r) => r.status === 'AVAILABLE' && (!types || types.includes(r.type)),
    )
    .map((r) => ({
      id: r.id,
      label: r.label,
      type: r.type,
      distanceKm: haversineKm({ lat, lng }, { lat: r.lat, lng: r.lng }),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export function setResourceStatus(id: string, status: ResourceStatus, actor: Actor): Resource {
  const r = getResource(id);
  if (!r) throw new Error('Resource not found');
  const from = r.status;
  r.status = status;
  r.updatedAt = now();
  if (status === 'AVAILABLE') r.assignedIncidentId = null;
  persist();
  publish('resource', 'updated', { id: r.id, data: r });
  audit({
    userId: actor.id,
    userName: actor.name,
    role: actor.role,
    action: 'RESOURCE_STATUS',
    entityType: 'resource',
    entityId: r.id,
    fromState: from,
    toState: status,
    detail: r.label,
  });
  return r;
}

/** Assign a resource to an incident. Prevents conflicts (already deployed). */
export function assignResource(resourceId: string, incidentId: string, actor: Actor): Resource {
  const r = getResource(resourceId);
  if (!r) throw new Error('Resource not found');
  const inc = getIncident(incidentId);
  if (!inc) throw new Error('Incident not found');
  if (r.status === 'DEPLOYED' && r.assignedIncidentId && r.assignedIncidentId !== incidentId) {
    throw new Error(
      `Conflict: ${r.label} already deployed to ${r.assignedIncidentId}`,
    );
  }
  if (r.status === 'OFFLINE' || r.status === 'MAINTENANCE') {
    throw new Error(`Cannot assign ${r.label}: status is ${r.status}`);
  }
  const from = r.status;
  r.status = 'DEPLOYED';
  r.assignedIncidentId = incidentId;
  r.updatedAt = now();
  persist();
  publish('resource', 'updated', { id: r.id, data: r });
  addUpdate(incidentId, {
    authorId: actor.id,
    authorName: actor.name,
    kind: 'RESOURCE',
    message: `Deployed ${r.label} (${prettyType(r.type)}) to incident`,
  });
  audit({
    userId: actor.id,
    userName: actor.name,
    role: actor.role,
    action: 'RESOURCE_ASSIGN',
    entityType: 'resource',
    entityId: r.id,
    incidentId,
    fromState: from,
    toState: 'DEPLOYED',
    detail: `${r.label} → ${incidentId}`,
  });
  return r;
}

export function releaseResource(resourceId: string, actor: Actor): Resource {
  const r = getResource(resourceId);
  if (!r) throw new Error('Resource not found');
  const prevIncident = r.assignedIncidentId;
  r.status = 'AVAILABLE';
  r.assignedIncidentId = null;
  r.updatedAt = now();
  persist();
  publish('resource', 'updated', { id: r.id, data: r });
  audit({
    userId: actor.id,
    userName: actor.name,
    role: actor.role,
    action: 'RESOURCE_RELEASE',
    entityType: 'resource',
    entityId: r.id,
    incidentId: prevIncident,
    toState: 'AVAILABLE',
    detail: r.label,
  });
  return r;
}

function prettyType(t: ResourceType): string {
  return t.toLowerCase().replace(/_/g, ' ');
}
