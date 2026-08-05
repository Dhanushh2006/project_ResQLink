import { z } from 'zod';
import { guard, ok, fail } from '@/lib/api';
import { submitReport, listReports } from '@/lib/services/reports';

export const dynamic = 'force-dynamic';
export async function GET() {
  const g = await guard();
  if ('response' in g) return g.response;
  return ok(listReports());
}

const schema = z.object({
  raw: z.string().min(4),
  reporter: z.string().default('Anonymous'),
  channel: z.enum(['CITIZEN','FIELD','RADIO','SENSOR','PHONE']).default('CITIZEN'),
  locationName: z.string().default('Unknown'),
  lat: z.number(),
  lng: z.number(),
});

export async function POST(req: Request) {
  const g = await guard();
  if ('response' in g) return g.response;
  let body: unknown;
  try { body = await req.json(); } catch { return fail('Invalid body'); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message || 'Invalid input');
  const r = await submitReport(parsed.data, g.actor);
  return ok(r, 201);
}
