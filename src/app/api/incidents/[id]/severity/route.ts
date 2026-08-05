import { z } from 'zod';
import { guard, ok, fail } from '@/lib/api';
import { setSeverity } from '@/lib/services/incidents';

const schema = z.object({ severity: z.enum(['CRITICAL','HIGH','MODERATE','LOW']), reason: z.string().optional() });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard('incident:update');
  if ('response' in g) return g.response;
  const { id } = await params;
  let body: unknown;
  try { body = await req.json(); } catch { return fail('Invalid body'); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail('Invalid severity');
  try {
    return ok(setSeverity(id, parsed.data.severity, g.actor, parsed.data.reason));
  } catch (e) { return fail((e as Error).message); }
}
