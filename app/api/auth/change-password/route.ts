import { getActor, hashPassword, verifyPassword, json, error } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const actor = await getActor(req);
    if (!actor) return error('Unauthorized', 401);
    const { currentPassword, newPassword } = await req.json();
    if (!newPassword || newPassword.length < 6) return error('New password must be at least 6 characters');
    const user: any = await queryOne('SELECT password_hash FROM users WHERE id = $1', [actor.id]);
    if (!user || !verifyPassword(currentPassword || '', user.password_hash)) return error('Current password is incorrect', 401);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashPassword(newPassword), actor.id]);
    return json({ ok: true });
  } catch (e: any) {
    return error(e.message || 'Database error', 500);
  }
}
