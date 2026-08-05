import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { ensureSeeded } from '@/lib/bootstrap';
import { verifyPassword, createSession, SESSION_COOKIE } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { fail, rateLimit } from '@/lib/api';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  ensureSeeded();
  const ip = req.headers.get('x-forwarded-for') || 'local';
  if (!rateLimit(`login:${ip}`, 10, 60000)) return fail('Too many attempts. Try again shortly.', 429);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail('Invalid request body');
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail('Email and password are required');

  const user = db().users.find(
    (u) => u.email.toLowerCase() === parsed.data.email.toLowerCase(),
  );
  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    return fail('Invalid credentials', 401);
  }

  const token = await createSession(user);
  const res = NextResponse.json({
    ok: true,
    data: { id: user.id, name: user.name, role: user.role, agencyId: user.agencyId },
  });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12,
  });
  audit({
    userId: user.id,
    userName: user.name,
    role: user.role,
    action: 'LOGIN',
    entityType: 'session',
    entityId: user.id,
    detail: `${user.role} signed in`,
  });
  return res;
}
