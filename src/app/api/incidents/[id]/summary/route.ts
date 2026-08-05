import { guard, ok, fail } from '@/lib/api';
import { generateAiSummary } from '@/lib/services/incidents';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard();
  if ('response' in g) return g.response;
  const { id } = await params;
  try {
    const summary = await generateAiSummary(id);
    return ok({ summary });
  } catch (e) { return fail((e as Error).message); }
}
