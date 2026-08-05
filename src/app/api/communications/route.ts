import { z } from 'zod';
import { guard, ok, fail } from '@/lib/api';
import { sendCommunication, listCommunications } from '@/lib/services/communications';

export const dynamic = 'force-dynamic';
export async function GET() {
  const g = await guard();
  if ('response' in g) return g.response;
  return ok(listCommunications());
}

const schema = z.object({
  type: z.enum(['INCIDENT_UPDATE','AGENCY_MESSAGE','COMMANDER_BROADCAST','CRITICAL_ALERT','RESOURCE_REQUEST','ESCALATION_ALERT','PUBLIC_DRAFT']),
  priority: z.enum(['LOW','NORMAL','HIGH','CRITICAL']),
  targetAgencyId: z.string().nullable().optional(),
  incidentId: z.string().nullable().optional(),
  subject: z.string().min(1),
  body: z.string().min(1),
});

export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch { return fail('Invalid body'); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message || 'Invalid input');
  const cap = (parsed.data.type === 'COMMANDER_BROADCAST' || parsed.data.type === 'ESCALATION_ALERT') ? 'comm:broadcast' : 'comm:send';
  const g = await guard(cap);
  if ('response' in g) return g.response;
  return ok(sendCommunication(parsed.data as any, g.actor), 201);
}
