import { getActor, json, error } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { PLANS, addDays, type PlanKey } from '@/lib/subscription';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const actor = await getActor(req);
    if (!actor || actor.role !== 'admin') return error('Forbidden', 403);
    const rows = await query(
      `SELECT p.*, s.name AS shop_name FROM payments p JOIN shops s ON s.id = p.shop_id ORDER BY p.created_at DESC`
    );
    return json({ ok: true, payments: rows });
  } catch (e: any) {
    return error(e.message || 'Database error', 500);
  }
}

export async function PATCH(req: Request) {
  try {
    const actor = await getActor(req);
    if (!actor || actor.role !== 'admin') return error('Forbidden', 403);
    const { id, action } = await req.json();
    const payment: any = await queryOne('SELECT * FROM payments WHERE id = $1', [id]);
    if (!payment) return error('Payment not found', 404);
    if (action === 'reject') {
      await query("UPDATE payments SET status = 'rejected', reviewed_at = NOW() WHERE id = $1", [id]);
      return json({ ok: true });
    }
    if (action === 'approve') {
      const shop: any = await queryOne('SELECT * FROM shops WHERE id = $1', [payment.shop_id]);
      const base = shop.expiry_date && new Date(shop.expiry_date).getTime() > Date.now() ? new Date(shop.expiry_date) : new Date();
      const planKey = (PLANS as any)[payment.plan] ? (payment.plan as PlanKey) : 'basic';
      await query("UPDATE payments SET status = 'approved', reviewed_at = NOW() WHERE id = $1", [id]);
      await query("UPDATE shops SET expiry_date = $1, status = 'active', plan = $2, price = $3 WHERE id = $4", [addDays(base, 30), planKey, PLANS[planKey].price, payment.shop_id]);
      return json({ ok: true });
    }
    return error('Unknown action');
  } catch (e: any) {
    return error(e.message || 'Database error', 500);
  }
}
