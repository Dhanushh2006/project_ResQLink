import { z } from 'zod';
import { guard, ok, fail } from '@/lib/api';
import { getSimState, startSimulation, stepSimulation, resetSimulation } from '@/lib/services/simulation';

export const dynamic = 'force-dynamic';

export async function GET() {
  const g = await guard();
  if ('response' in g) return g.response;
  return ok(getSimState());
}

const schema = z.object({ action: z.enum(['start','step','reset']), scenarioId: z.string().optional() });

export async function POST(req: Request) {
  const g = await guard('sim:control');
  if ('response' in g) return g.response;
  let body: unknown;
  try { body = await req.json(); } catch { return fail('Invalid body'); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail('Invalid action');
  try {
    if (parsed.data.action === 'start') return ok(startSimulation(parsed.data.scenarioId));
    if (parsed.data.action === 'step') return ok(await stepSimulation());
    return ok(resetSimulation());
  } catch (e) { return fail((e as Error).message); }
}
