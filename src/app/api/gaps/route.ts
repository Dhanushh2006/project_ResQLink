import { guard, ok } from '@/lib/api';
import { listGaps } from '@/lib/services/alerts';
import { scanCoordinationGaps } from '@/lib/services/gap-engine';

export const dynamic = 'force-dynamic';
export async function GET() {
  const g = await guard();
  if ('response' in g) return g.response;
  scanCoordinationGaps();
  return ok(listGaps());
}
