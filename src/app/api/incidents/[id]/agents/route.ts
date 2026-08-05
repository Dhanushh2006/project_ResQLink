import { z } from 'zod';
import { guard, ok, fail } from '@/lib/api';
import {
  runIntelligenceAgent, runCoordinationAgent, runResourceAgent,
  runRouteAgent, runCommunicationAgent, runEscalationAgent,
} from '@/lib/services/agents';

const schema = z.object({
  agent: z.enum(['intelligence','coordination','resource','route','communication','escalation']),
  audience: z.enum(['AGENCY','COMMANDER','PUBLIC']).optional(),
  agency: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard();
  if ('response' in g) return g.response;
  const { id } = await params;
  let body: unknown;
  try { body = await req.json(); } catch { return fail('Invalid body'); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail('Unknown agent');
  try {
    let rec;
    switch (parsed.data.agent) {
      case 'intelligence': rec = await runIntelligenceAgent(id); break;
      case 'coordination': rec = await runCoordinationAgent(id); break;
      case 'resource': rec = await runResourceAgent(id); break;
      case 'route': rec = await runRouteAgent(id); break;
      case 'escalation': rec = await runEscalationAgent(id); break;
      case 'communication':
        rec = await runCommunicationAgent(id, parsed.data.audience || 'AGENCY', parsed.data.agency as any);
        break;
    }
    return ok(rec, 201);
  } catch (e) { return fail((e as Error).message); }
}
