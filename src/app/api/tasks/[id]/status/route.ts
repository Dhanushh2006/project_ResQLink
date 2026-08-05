import { z } from 'zod';
import { guard, ok, fail } from '@/lib/api';
import { setTaskStatus } from '@/lib/services/tasks';

const schema = z.object({ status: z.enum(['PENDING','ASSIGNED','ACKNOWLEDGED','IN_PROGRESS','BLOCKED','COMPLETED']) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard('task:update');
  if ('response' in g) return g.response;
  const { id } = await params;
  let body: unknown;
  try { body = await req.json(); } catch { return fail('Invalid body'); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail('Invalid status');
  try { return ok(setTaskStatus(id, parsed.data.status, g.actor)); }
  catch (e) { return fail((e as Error).message); }
}
