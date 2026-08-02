// Structured operational messaging with acknowledgement lifecycle
// (SENT → DELIVERED → ACKNOWLEDGED) rather than a plain chat.

import { db, persist, uid, now } from '../db';
import { publish } from '../bus';
import { audit } from '../audit';
import type { AckState, CommType, Communication, Priority } from '../types';
import type { Actor } from './incidents';

export function listCommunications(): Communication[] {
  return [...db().communications].sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
  );
}

export function getCommunication(id: string): Communication | undefined {
  return db().communications.find((c) => c.id === id);
}

export interface SendInput {
  type: CommType;
  priority: Priority;
  targetAgencyId?: string | null;
  incidentId?: string | null;
  subject: string;
  body: string;
}

export function sendCommunication(input: SendInput, actor: Actor): Communication {
  const c: Communication = {
    id: uid('cmm'),
    type: input.type,
    priority: input.priority,
    senderId: actor.id,
    senderName: actor.name,
    targetAgencyId: input.targetAgencyId ?? null,
    incidentId: input.incidentId ?? null,
    subject: input.subject,
    body: input.body,
    ackState: 'SENT',
    ackAt: null,
    createdAt: now(),
  };
  db().communications.unshift(c);
  persist();
  publish('communication', 'created', { id: c.id, data: c });
  audit({
    userId: actor.id,
    userName: actor.name,
    role: actor.role,
    action: 'COMM_SEND',
    entityType: 'communication',
    entityId: c.id,
    incidentId: c.incidentId,
    toState: 'SENT',
    detail: `[${c.priority}] ${c.subject}`,
  });
  // simulate delivery shortly after send (transport ack)
  setTimeout(() => {
    const live = getCommunication(c.id);
    if (live && live.ackState === 'SENT') {
      live.ackState = 'DELIVERED';
      persist();
      publish('communication', 'updated', { id: live.id, data: live });
    }
  }, 1200);
  return c;
}

export function acknowledge(id: string, actor: Actor): Communication {
  const c = getCommunication(id);
  if (!c) throw new Error('Communication not found');
  const from = c.ackState;
  c.ackState = 'ACKNOWLEDGED';
  c.ackAt = now();
  persist();
  publish('communication', 'updated', { id: c.id, data: c });
  audit({
    userId: actor.id,
    userName: actor.name,
    role: actor.role,
    action: 'COMM_ACK',
    entityType: 'communication',
    entityId: c.id,
    incidentId: c.incidentId,
    fromState: from,
    toState: 'ACKNOWLEDGED',
    detail: c.subject,
  });
  return c;
}

export function setDelivered(id: string): void {
  const c = getCommunication(id);
  if (c && c.ackState === 'SENT') {
    c.ackState = 'DELIVERED';
    persist();
    publish('communication', 'updated', { id: c.id, data: c });
  }
}
