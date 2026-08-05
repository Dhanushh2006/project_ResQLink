import { z } from 'zod';
import { guard, ok, fail } from '@/lib/api';
import { createIncident, listIncidents } from '@/lib/services/incidents';

export const dynamic = 'force-dynamic';

export async function GET() {
  const g = await guard();
  if ('response' in g) return g.response;
  return ok(listIncidents());
}

const schema = z.object({
  title: z.string().min(3),
  type: z.string(),
  severity: z.enum(['CRITICAL', 'HIGH', 'MODERATE', 'LOW']),
  description: z.string().min(3),
  source: z.string().min(1),
  locationName: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
  affectedPopulation: z.number().optional(),
  agencyIds: z.array(z.string()).optional(),
  requiredResourceTypes: z.array(z.string()).optional(),
  status: z.string().optional(),
});

export async function POST(req: Request) {
  const g = await guard('incident:create');
  if ('response' in g) return g.response;
  let body: unknown;
  try { body = await req.json(); } catch { return fail('Invalid body'); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message || 'Invalid input');
  const inc = createIncident(parsed.data as any, g.actor);
  return ok(inc, 201);
}
