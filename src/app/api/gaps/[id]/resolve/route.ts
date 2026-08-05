import { guard, ok, fail } from '@/lib/api';
import { resolveGap } from '@/lib/services/alerts';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard();
  if ('response' in g) return g.response;
  const { id } = await params;
  try { return ok(resolveGap(id, g.actor)); }
  catch (e) { return fail((e as Error).message); }
}
