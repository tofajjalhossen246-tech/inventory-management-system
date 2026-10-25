import { getActor, requireShopActor, canManageTeam, hashPassword, json, error } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Owner resets an employee password, or deletes an employee account.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const actor = requireShopActor(await getActor(req));
    if (!canManageTeam(actor.role)) return error('Only the shop owner can manage the team', 403);
    const { password } = await req.json();
    if (!password || password.length < 6) return error('New password must be at least 6 characters');
    await query('UPDATE users SET password_hash = $1 WHERE id = $2 AND shop_id = $3 AND role != $4', [hashPassword(password), params.id, actor.shop_id, 'owner']);
    return json({ ok: true });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return error(e.message || 'Database error', 500);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const actor = requireShopActor(await getActor(req));
    if (!canManageTeam(actor.role)) return error('Only the shop owner can manage the team', 403);
    await query('DELETE FROM users WHERE id = $1 AND shop_id = $2 AND role != $3', [params.id, actor.shop_id, 'owner']);
    return json({ ok: true });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return error(e.message || 'Database error', 500);
  }
}
