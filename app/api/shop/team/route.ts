import { getActor, requireShopActor, canManageTeam, hashPassword, json, error } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const actor = requireShopActor(await getActor(req));
    const rows = await query('SELECT id, username, email, role, created_at FROM users WHERE shop_id = $1 ORDER BY created_at ASC', [actor.shop_id]);
    return json({ ok: true, team: rows });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return error(e.message || 'Database error', 500);
  }
}

export async function POST(req: Request) {
  try {
    const actor = requireShopActor(await getActor(req));
    if (!canManageTeam(actor.role)) return error('Only the shop owner can manage the team', 403);
    const { username, email, password, role } = await req.json();
    if (!username || !password || password.length < 6) return error('Username and a password of at least 6 characters are required');
    if (!['manager', 'cashier', 'viewer'].includes(role)) return error('Role must be manager, cashier or viewer');
    const row: any = await queryOne(
      'INSERT INTO users (username, email, password_hash, role, shop_id) VALUES ($1,$2,$3,$4,$5) RETURNING id, username, email, role',
      [username.trim(), email ? String(email).trim().toLowerCase() : null, hashPassword(password), role, actor.shop_id]
    );
    return json({ ok: true, user: row }, 201);
  } catch (e: any) {
    if (e instanceof Response) return e;
    if (String(e.message || '').includes('duplicate')) return error('That username is already taken', 409);
    return error(e.message || 'Database error', 500);
  }
}
