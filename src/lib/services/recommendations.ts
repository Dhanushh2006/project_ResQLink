// Persists AI recommendations and records the human-in-the-loop
// decision (APPROVE / MODIFY / REJECT) with full audit linkage.

import { db, persist, uid, now } from '../db';
import { publish } from '../bus';
import { audit } from '../audit';
import type { AiRecommendation } from '../types';
import type { Actor } from './incidents';

export function listRecommendations(incidentId?: string): AiRecommendation[] {
  return db()
    .aiRecommendations.filter((r) => !incidentId || r.incidentId === incidentId)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export function getRecommendation(id: string): AiRecommendation | undefined {
  return db().aiRecommendations.find((r) => r.id === id);
}

export function createRecommendation(
  rec: Omit<AiRecommendation, 'id' | 'status' | 'decidedById' | 'decidedAt' | 'createdAt'>,
): AiRecommendation {
  const r: AiRecommendation = {
    id: uid('rec'),
    status: 'PENDING',
    decidedById: null,
    decidedAt: null,
    createdAt: now(),
    ...rec,
  };
  db().aiRecommendations.unshift(r);
  persist();
  publish('ai_recommendation', 'created', { id: r.id, data: r });
  return r;
}

export function decideRecommendation(
  id: string,
  decision: 'APPROVED' | 'MODIFIED' | 'REJECTED',
  actor: Actor,
): AiRecommendation {
  const r = getRecommendation(id);
  if (!r) throw new Error('Recommendation not found');
  r.status = decision;
  r.decidedById = actor.id;
  r.decidedAt = now();
  persist();
  publish('ai_recommendation', 'updated', { id: r.id, data: r });
  audit({
    userId: actor.id,
    userName: actor.name,
    role: actor.role,
    action: `AI_${decision}`,
    entityType: 'ai_recommendation',
    entityId: r.id,
    incidentId: r.incidentId,
    aiRecommendationId: r.id,
    toState: decision,
    detail: `${r.agent}: ${r.title}`,
  });
  return r;
}
