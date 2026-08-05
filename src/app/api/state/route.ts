// Consolidated operational-state snapshot for dashboards.
import { guard } from '@/lib/api';
import { ok } from '@/lib/api';
import { db } from '@/lib/db';
import { listIncidents } from '@/lib/services/incidents';
import { listResources } from '@/lib/services/resources';
import { listTasks, overdueTasks } from '@/lib/services/tasks';
import { listCommunications } from '@/lib/services/communications';
import { listAlerts, listGaps } from '@/lib/services/alerts';
import { listReports } from '@/lib/services/reports';
import { listRecommendations } from '@/lib/services/recommendations';
import { scanCoordinationGaps, evaluateAlertRules } from '@/lib/services/gap-engine';
import { getSimState } from '@/lib/services/simulation';
import { providerInfo } from '@/lib/ai';

export const dynamic = 'force-dynamic';

export async function GET() {
  const g = await guard();
  if ('response' in g) return g.response;

  // Opportunistically evaluate rules on each snapshot fetch.
  try {
    scanCoordinationGaps();
    evaluateAlertRules();
  } catch (e) {
    console.error('[state] rule eval error', e);
  }

  const incidents = listIncidents();
  const resources = listResources();
  const tasks = listTasks();

  return ok({
    incidents,
    resources,
    tasks,
    overdueTasks: overdueTasks().map((t) => t.id),
    communications: listCommunications(),
    alerts: listAlerts(),
    gaps: listGaps(),
    reports: listReports(),
    recommendations: listRecommendations(),
    agencies: db().agencies,
    zones: db().zones,
    facilities: db().facilities,
    roads: db().roads,
    scenarios: db().scenarios,
    auditEvents: db().auditEvents.slice(0, 200),
    sim: getSimState(),
    ai: providerInfo(),
    stats: {
      activeIncidents: incidents.filter((i) => !['RESOLVED', 'ARCHIVED'].includes(i.status)).length,
      criticalIncidents: incidents.filter((i) => i.severity === 'CRITICAL' && !['RESOLVED', 'ARCHIVED'].includes(i.status)).length,
      highIncidents: incidents.filter((i) => i.severity === 'HIGH' && !['RESOLVED', 'ARCHIVED'].includes(i.status)).length,
      availableResources: resources.filter((r) => r.status === 'AVAILABLE').length,
      deployedResources: resources.filter((r) => r.status === 'DEPLOYED').length,
      openGaps: listGaps().length,
      openAlerts: listAlerts().filter((a) => a.status === 'OPEN').length,
      pendingAcks: listCommunications().filter((c) => (c.priority === 'CRITICAL' || c.priority === 'HIGH') && c.ackState !== 'ACKNOWLEDGED').length,
    },
  });
}
