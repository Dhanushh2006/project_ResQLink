import { guard, ok, fail } from '@/lib/api';
import { resolveAlert, acknowledgeAlert } from '@/lib/services/alerts';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard();
  if ('response' in g) return g.response;
  const { id } = await params;
  const url = new URL(req.url);
  const ack = url.searchParams.get('ack') === '1';
  try { return ok(ack ? acknowledgeAlert(id, g.actor) : resolveAlert(id, g.actor)); }
  catch (e) { return fail((e as Error).message); }
}
