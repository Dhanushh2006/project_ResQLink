import { guard, ok } from '@/lib/api';
import { runBriefingAgent } from '@/lib/services/agents';
import { providerInfo } from '@/lib/ai';

export const dynamic = 'force-dynamic';
export async function POST() {
  const g = await guard();
  if ('response' in g) return g.response;
  const brief = await runBriefingAgent();
  return ok({ brief, generatedAt: new Date().toISOString(), engine: providerInfo() });
}
