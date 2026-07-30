// - Passwords hashed with scrypt (Node crypto), salted per user.
// - Sessions are stateless HS256 JWTs stored in an httpOnly cookie.
// - Role-based permission matrix drives authorization checks.

import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { Role, User } from './types';
import { db } from './db';

import { SESSION_COOKIE } from './constants';

const DEV_SECRET = 'resqlink-dev-secret-not-for-production-use-only';
const secretKey = new TextEncoder().encode(
  process.env.AUTH_SECRET || DEV_SECRET,
);
export { SESSION_COOKIE };

// ---------------- Password hashing ----------------

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [scheme, salt, hash] = stored.split('$');
    if (scheme !== 'scrypt' || !salt || !hash) return false;
    const derived = scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, 'hex');
    if (derived.length !== expected.length) return false;
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

// ---------------- Session tokens ----------------

export interface SessionClaims {
  sub: string;
  name: string;
  role: Role;
  agencyId: string | null;
}

export async function createSession(user: User): Promise<string> {
  return await new SignJWT({
    name: user.name,
    role: user.role,
    agencyId: user.agencyId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(secretKey);
}

export async function readSession(
  token: string | undefined,
): Promise<SessionClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return {
      sub: String(payload.sub),
      name: String(payload.name),
      role: payload.role as Role,
      agencyId: (payload.agencyId as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

/** Read the current session from the cookie store (server components / routes). */
export async function getSession(): Promise<SessionClaims | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return readSession(token);
}

export async function getCurrentUser(): Promise<User | null> {
  const claims = await getSession();
  if (!claims) return null;
  return db().users.find((u) => u.id === claims.sub) ?? null;
}

// ---------------- Authorization ----------------

/**
 * Capability-based permission matrix. Keys are capability strings;
 * values are the roles allowed to perform them. SYSTEM_ADMIN and
 * INCIDENT_COMMANDER have the broadest authority.
 */
const PERMISSIONS: Record<string, Role[]> = {
  'incident:create': [
    'INCIDENT_COMMANDER',
    'SYSTEM_ADMIN',
    'POLICE_COORDINATOR',
    'FIRE_COORDINATOR',
    'EMS_COORDINATOR',
    'MUNICIPAL_AUTHORITY',
  ],
  'incident:update': [
    'INCIDENT_COMMANDER',
    'SYSTEM_ADMIN',
    'POLICE_COORDINATOR',
    'FIRE_COORDINATOR',
    'EMS_COORDINATOR',
    'MUNICIPAL_AUTHORITY',
    'RELIEF_COORDINATOR',
  ],
  'incident:verify': ['INCIDENT_COMMANDER', 'SYSTEM_ADMIN'],
  'incident:escalate': ['INCIDENT_COMMANDER', 'SYSTEM_ADMIN'],
  'resource:assign': [
    'INCIDENT_COMMANDER',
    'SYSTEM_ADMIN',
    'POLICE_COORDINATOR',
    'FIRE_COORDINATOR',
    'EMS_COORDINATOR',
    'MUNICIPAL_AUTHORITY',
    'RELIEF_COORDINATOR',
  ],
  'task:create': [
    'INCIDENT_COMMANDER',
    'SYSTEM_ADMIN',
    'POLICE_COORDINATOR',
    'FIRE_COORDINATOR',
    'EMS_COORDINATOR',
    'MUNICIPAL_AUTHORITY',
    'RELIEF_COORDINATOR',
  ],
  'task:update': [
    'INCIDENT_COMMANDER',
    'SYSTEM_ADMIN',
    'POLICE_COORDINATOR',
    'FIRE_COORDINATOR',
    'EMS_COORDINATOR',
    'MUNICIPAL_AUTHORITY',
    'RELIEF_COORDINATOR',
    'FIELD_RESPONDER',
  ],
  'comm:send': [
    'INCIDENT_COMMANDER',
    'SYSTEM_ADMIN',
    'POLICE_COORDINATOR',
    'FIRE_COORDINATOR',
    'EMS_COORDINATOR',
    'MUNICIPAL_AUTHORITY',
    'RELIEF_COORDINATOR',
  ],
  'comm:broadcast': ['INCIDENT_COMMANDER', 'SYSTEM_ADMIN'],
  'ai:decide': ['INCIDENT_COMMANDER', 'SYSTEM_ADMIN'],
  'report:triage': [
    'INCIDENT_COMMANDER',
    'SYSTEM_ADMIN',
    'POLICE_COORDINATOR',
    'FIRE_COORDINATOR',
    'EMS_COORDINATOR',
    'MUNICIPAL_AUTHORITY',
  ],
  'sim:control': ['INCIDENT_COMMANDER', 'SYSTEM_ADMIN'],
  'admin:manage': ['SYSTEM_ADMIN'],
};

export function can(role: Role, capability: string): boolean {
  const allowed = PERMISSIONS[capability];
  if (!allowed) return false;
  return allowed.includes(role);
}

export const CAPABILITIES = PERMISSIONS;
