import { getActor, hashPassword, json, error } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { PLANS, addDays, type PlanKey } from '@/lib/subscription';

export const dynamic = 'force-dynamic';

/** Admin list: subscription fields ONLY. No products, stock, sales or team data. */
export async function GET(req: Request) {
  try {
    const actor = await getActor(req);
    if (!actor || actor.role !== 'admin') return error('Forbidden', 403);
    const rows = await query(
      `SELECT s.id, s.name, u.username AS owner_username, s.owner_phone, s.plan, s.price, s.expiry_date, s.status, s.created_at
       FROM shops s LEFT JOIN users u ON u.shop_id = s.id AND u.role = 'owner'
       ORDER BY s.created_at DESC`
    );
    return json({ ok: true, shops: rows });
  } catch (e: any) {
    return error(e.message || 'Database error', 500);
  }
}

export async function POST(req: Request) {
  try {
    const actor = await getActor(req);
    if (!actor || actor.role !== 'admin') return error('Forbidden', 403);
    const { name, ownerUsername, ownerEmail, ownerPassword, ownerPhone, plan } = await req.json();
    if (!name || !ownerUsername || !ownerPassword || ownerPassword.length < 6) {
      return error('Shop name, owner username and a password of at least 6 characters are required');
    }
    const planKey = (PLANS as any)[plan] ? (plan as PlanKey) : 'trial';
    const planInfo = PLANS[planKey];
    const shop: any = await queryOne(
      'INSERT INTO shops (name, owner_phone, plan, price, status, expiry_date) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [name.trim(), ownerPhone || null, planKey, planInfo.price, planKey === 'trial' ? 'trial' : 'active', addDays(new Date(), planInfo.days)]
    );
    await query(
      'INSERT INTO users (username, email, password_hash, role, shop_id) VALUES ($1,$2,$3,$4,$5)',
      [ownerUsername.trim(), ownerEmail ? String(ownerEmail).trim().toLowerCase() : null, hashPassword(ownerPassword), 'owner', shop.id]
    );
    return json({ ok: true, shop }, 201);
  } catch (e: any) {
    if (String(e.message || '').includes('duplicate')) return error('That owner username is already taken', 409);
    return error(e.message || 'Database error', 500);
  }
}
