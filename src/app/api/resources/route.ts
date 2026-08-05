import { guard, ok } from '@/lib/api';
import { listResources } from '@/lib/services/resources';

export const dynamic = 'force-dynamic';
export async function GET() {
  const g = await guard();
  if ('response' in g) return g.response;
  return ok(listResources());
}
