import { guard, ok, fail } from '@/lib/api';
import { acknowledge } from '@/lib/services/communications';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard();
  if ('response' in g) return g.response;
  const { id } = await params;
  try { return ok(acknowledge(id, g.actor)); }
  catch (e) { return fail((e as Error).message); }
}
