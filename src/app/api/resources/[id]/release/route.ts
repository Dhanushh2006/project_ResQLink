import { guard, ok, fail } from '@/lib/api';
import { releaseResource } from '@/lib/services/resources';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard('resource:assign');
  if ('response' in g) return g.response;
  const { id } = await params;
  try { return ok(releaseResource(id, g.actor)); }
  catch (e) { return fail((e as Error).message); }
}
