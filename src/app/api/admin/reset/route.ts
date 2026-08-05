import { guard, ok } from '@/lib/api';
import { replaceAll } from '@/lib/db';
import { buildSeed } from '@/lib/seed-data';
import { resetSimulation } from '@/lib/services/simulation';
import { publish } from '@/lib/bus';

export async function POST() {
  const g = await guard('sim:control');
  if ('response' in g) return g.response;
  replaceAll(buildSeed());
  resetSimulation();
  publish('sim', 'reset', {});
  publish('incident', 'reset', {});
  return ok({ reset: true });
}
