import { ensureSeeded } from '@/lib/bootstrap';
import { getCurrentUser } from '@/lib/auth';
import { ok, fail } from '@/lib/api';
import { db } from '@/lib/db';

export async function GET() {
  ensureSeeded();
  const user = await getCurrentUser();
  if (!user) return fail('Unauthorized', 401);
  const agency = db().agencies.find((a) => a.id === user.agencyId) || null;
  return ok({
    id: user.id, name: user.name, email: user.email, role: user.role,
    agencyId: user.agencyId, agency, avatarColor: user.avatarColor,
  });
}
