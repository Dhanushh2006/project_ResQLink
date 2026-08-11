import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, can, createSession, readSession } from '../src/lib/auth';
import type { User } from '../src/lib/types';

describe('Authentication', () => {
  it('hashes and verifies passwords', () => {
    const h = hashPassword('resqlink');
    expect(verifyPassword('resqlink', h)).toBe(true);
    expect(verifyPassword('wrong', h)).toBe(false);
  });

  it('produces distinct salts', () => {
    expect(hashPassword('x')).not.toBe(hashPassword('x'));
  });

  it('round-trips a session JWT', async () => {
    const user: User = {
      id: 'U-CMD', name: 'Cmdr', email: 'c@d.e', passwordHash: 'x',
      role: 'INCIDENT_COMMANDER', agencyId: 'AG-CMD', avatarColor: '#fff', createdAt: '',
    };
    const token = await createSession(user);
    const claims = await readSession(token);
    expect(claims?.sub).toBe('U-CMD');
    expect(claims?.role).toBe('INCIDENT_COMMANDER');
  });

  it('rejects garbage tokens', async () => {
    expect(await readSession('not.a.jwt')).toBeNull();
    expect(await readSession(undefined)).toBeNull();
  });
});

describe('Authorization matrix', () => {
  it('allows commander to escalate and decide AI', () => {
    expect(can('INCIDENT_COMMANDER', 'incident:escalate')).toBe(true);
    expect(can('INCIDENT_COMMANDER', 'ai:decide')).toBe(true);
  });
  it('forbids field responder from escalating', () => {
    expect(can('FIELD_RESPONDER', 'incident:escalate')).toBe(false);
  });
  it('lets field responder update tasks', () => {
    expect(can('FIELD_RESPONDER', 'task:update')).toBe(true);
  });
  it('only admin can manage admin', () => {
    expect(can('SYSTEM_ADMIN', 'admin:manage')).toBe(true);
    expect(can('POLICE_COORDINATOR', 'admin:manage')).toBe(false);
  });
});
