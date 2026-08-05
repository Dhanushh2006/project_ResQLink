import { z } from 'zod';
import { guard, ok, fail } from '@/lib/api';
import { assignResource } from '@/lib/services/resources';

const schema = z.object({ incidentId: z.string() });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard('resource:assign');
  if ('response' in g) return g.response;
  const { id } = await params;
  let body: unknown;
  try { body = await req.json(); } catch { return fail('Invalid body'); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail('incidentId required');
  try { return ok(assignResource(id, parsed.data.incidentId, g.actor)); }
  catch (e) { return fail((e as Error).message, 409); }
}
