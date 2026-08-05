import { guard, ok } from '@/lib/api';
import { listRecommendations } from '@/lib/services/recommendations';

export const dynamic = 'force-dynamic';
export async function GET() {
  const g = await guard();
  if ('response' in g) return g.response;
  return ok(listRecommendations());
}
