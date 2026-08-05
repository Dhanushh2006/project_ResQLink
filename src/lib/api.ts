// Session extraction, authorization guards, JSON responses, and a
// lightweight per-identity rate limiter.

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { readSession, SESSION_COOKIE, can, type SessionClaims } from './auth';
import { db } from './db';
import { ensureSeeded } from './bootstrap';
import type { Actor } from './services/incidents';

export function ok(data: unknown, init?: number) {
  return NextResponse.json({ ok: true, data }, { status: init ?? 200 });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function requireSession(): Promise<SessionClaims | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return readSession(token);
}

export function actorFromSession(s: SessionClaims): Actor {
  return { id: s.sub, name: s.name, role: s.role };
}

/** Guard a route: ensures a valid session and (optionally) a capability. */
export async function guard(capability?: string): Promise<
  { session: SessionClaims; actor: Actor } | { response: NextResponse }
> {
  ensureSeeded();
  const session = await requireSession();
  if (!session) return { response: fail('Unauthorized', 401) };
  if (capability && !can(session.role, capability)) {
    return { response: fail('Forbidden: insufficient role', 403) };
  }
  return { session, actor: actorFromSession(session) };
}

// ---------------- rate limiter (in-memory, per identity+route) ----------------

const globalForRl = globalThis as unknown as {
  __resqlink_rl?: Map<string, { count: number; resetAt: number }>;
};
function rlStore() {
  if (!globalForRl.__resqlink_rl) globalForRl.__resqlink_rl = new Map();
  return globalForRl.__resqlink_rl;
}

export function rateLimit(key: string, limit = 30, windowMs = 10000): boolean {
  const store = rlStore();
  const nowT = Date.now();
  const entry = store.get(key);
  if (!entry || entry.resetAt < nowT) {
    store.set(key, { count: 1, resetAt: nowT + windowMs });
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}

export { db };
