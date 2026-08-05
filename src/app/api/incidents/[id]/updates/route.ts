import { z } from 'zod';
import { guard, ok, fail } from '@/lib/api';
import { addUpdate, getIncident } from '@/lib/services/incidents';

const schema = z.object({ message: z.string().min(1), kind: z.string().optional() });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard('incident:update');
  if ('response' in g) return g.response;
  const { id } = await params;
  if (!getIncident(id)) return fail('Incident not found', 404);
  let body: unknown;
  try { body = await req.json(); } catch { return fail('Invalid body'); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail('Message required');
  const u = addUpdate(id, {
    authorId: g.actor.id, authorName: g.actor.name,
    kind: (parsed.data.kind as any) || 'NOTE', message: parsed.data.message,
  });
  return ok(u, 201);
}
