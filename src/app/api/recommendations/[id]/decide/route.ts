import { z } from 'zod';
import { guard, ok, fail } from '@/lib/api';
import { decideRecommendation, getRecommendation } from '@/lib/services/recommendations';
import { assignResource, nearestAvailable } from '@/lib/services/resources';
import { getIncident, setSeverity, setStatus, updateIncidentFields } from '@/lib/services/incidents';
import { sendCommunication } from '@/lib/services/communications';

const schema = z.object({ decision: z.enum(['APPROVED','MODIFIED','REJECTED']), apply: z.boolean().optional() });

// Human-in-the-loop: on APPROVE, the system executes the approved action.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard('ai:decide');
  if ('response' in g) return g.response;
  const { id } = await params;
  let body: unknown;
  try { body = await req.json(); } catch { return fail('Invalid body'); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail('Invalid decision');
  const rec = getRecommendation(id);
  if (!rec) return fail('Recommendation not found', 404);

  const decided = decideRecommendation(id, parsed.data.decision, g.actor);
  const applied: string[] = [];

  if (parsed.data.decision === 'APPROVED' && parsed.data.apply !== false && rec.incidentId) {
    try {
      const inc = getIncident(rec.incidentId);
      if (inc) {
        if (rec.kind === 'RESOURCE') {
          const picks = (rec.payload?.picks as { resourceId: string }[]) || [];
          for (const p of picks) {
            try { assignResource(p.resourceId, inc.id, g.actor); applied.push(`deployed ${p.resourceId}`); }
            catch { /* conflict, skip */ }
          }
        } else if (rec.kind === 'ESCALATION' && rec.payload?.shouldEscalate) {
          setSeverity(inc.id, rec.payload.toSeverity as any, g.actor, 'AI escalation approved');
          if (inc.status !== 'ESCALATED') { try { setStatus(inc.id, 'ESCALATED', g.actor, 'AI escalation approved'); applied.push('escalated'); } catch {} }
        } else if (rec.kind === 'COORDINATION') {
          const add = (rec.payload?.addAgencyIds as string[]) || [];
          if (add.length) {
            updateIncidentFields(inc.id, { agencyIds: Array.from(new Set([...inc.agencyIds, ...add])) }, g.actor);
            applied.push(`engaged ${add.length} agency(ies)`);
          }
        } else if (rec.kind === 'COMMUNICATION') {
          const p = rec.payload as any;
          sendCommunication({
            type: p.audience === 'PUBLIC' ? 'PUBLIC_DRAFT' : p.audience === 'COMMANDER' ? 'COMMANDER_BROADCAST' : 'AGENCY_MESSAGE',
            priority: inc.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
            targetAgencyId: null, incidentId: inc.id,
            subject: p.subject, body: p.body,
          }, g.actor);
          applied.push('message sent');
        }
      }
    } catch (e) { console.error('[decide] apply error', e); }
  }
  return ok({ recommendation: decided, applied });
}
