import { guard, ok } from '@/lib/api';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export async function GET() {
  const g = await guard();
  if ('response' in g) return g.response;
  return ok(db().agencies);
}
