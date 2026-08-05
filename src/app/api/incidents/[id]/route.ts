import { guard, ok, fail } from '@/lib/api';
import { getIncident, getUpdates } from '@/lib/services/incidents';
import { tasksForIncident } from '@/lib/services/tasks';
import { listRecommendations } from '@/lib/services/recommendations';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard();
  if ('response' in g) return g.response;
  const { id } = await params;
  const inc = getIncident(id);
  if (!inc) return fail('Incident not found', 404);
  return ok({
    incident: inc,
    updates: getUpdates(inc.id),
    tasks: tasksForIncident(inc.id),
    recommendations: listRecommendations(inc.id),
    resources: db().resources.filter((r) => r.assignedIncidentId === inc.id),
    communications: db().communications.filter((c) => c.incidentId === inc.id),
    reports: db().incidentReports.filter((r) => r.linkedIncidentId === inc.id),
    agencies: db().agencies,
  });
}
