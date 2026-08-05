import { z } from 'zod';
import { guard, ok, fail } from '@/lib/api';
import { setStatus } from '@/lib/services/incidents';

const schema = z.object({ status: z.string(), note: z.string().optional() });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const cap = 'incident:update';
  const g = await guard(cap);
  if ('response' in g) return g.response;
  const { id } = await params;
  let body: unknown;
  try { body = await req.json(); } catch { return fail('Invalid body'); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail('Invalid status');
  try {
    const inc = setStatus(id, parsed.data.status as any, g.actor, parsed.data.note);
    return ok(inc);
  } catch (e) { return fail((e as Error).message); }
}
