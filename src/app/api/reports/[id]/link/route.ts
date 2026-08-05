import { z } from 'zod';
import { guard, ok, fail } from '@/lib/api';
import { linkReport, getReport } from '@/lib/services/reports';
import { createIncident } from '@/lib/services/incidents';
import { getProvider } from '@/lib/ai';

const schema = z.object({ incidentId: z.string().optional(), createNew: z.boolean().optional() });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard('report:triage');
  if ('response' in g) return g.response;
  const { id } = await params;
  let body: unknown;
  try { body = await req.json(); } catch { return fail('Invalid body'); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail('Invalid input');
  const report = getReport(id);
  if (!report) return fail('Report not found', 404);

  try {
    if (parsed.data.createNew) {
      const analysis = await getProvider().classifyIncident({ text: report.raw, locationName: report.locationName });
      const inc = createIncident({
        title: analysis.title,
        type: analysis.category,
        severity: analysis.severity,
        description: report.raw,
        source: `${report.channel} report ${report.id}`,
        locationName: report.locationName,
        lat: report.lat, lng: report.lng,
        requiredResourceTypes: analysis.requiredResources,
        status: 'VERIFIED',
      }, g.actor);
      const linked = linkReport(id, inc.id, g.actor);
      return ok({ report: linked, incident: inc }, 201);
    }
    if (!parsed.data.incidentId) return fail('incidentId required');
    return ok({ report: linkReport(id, parsed.data.incidentId, g.actor) });
  } catch (e) { return fail((e as Error).message); }
}
