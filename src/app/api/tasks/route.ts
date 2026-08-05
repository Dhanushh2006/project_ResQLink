import { z } from 'zod';
import { guard, ok, fail } from '@/lib/api';
import { createTask, listTasks } from '@/lib/services/tasks';

export const dynamic = 'force-dynamic';
export async function GET() {
  const g = await guard();
  if ('response' in g) return g.response;
  return ok(listTasks());
}

const schema = z.object({
  incidentId: z.string(),
  title: z.string().min(2),
  description: z.string().default(''),
  agencyId: z.string().nullable().optional(),
  resourceId: z.string().nullable().optional(),
  priority: z.enum(['LOW','NORMAL','HIGH','CRITICAL']),
  locationName: z.string().default(''),
  deadline: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  const g = await guard('task:create');
  if ('response' in g) return g.response;
  let body: unknown;
  try { body = await req.json(); } catch { return fail('Invalid body'); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message || 'Invalid input');
  return ok(createTask(parsed.data as any, g.actor), 201);
}
