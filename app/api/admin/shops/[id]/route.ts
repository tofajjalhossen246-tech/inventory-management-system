import { getActor, json, error } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { PLANS, addDays, addMonths, type PlanKey } from '@/lib/subscription';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const actor = await getActor(req);
    if (!actor || actor.role !== 'admin') return error('Forbidden', 403);
    const body = await req.json();
    const shop: any = await queryOne('SELECT * FROM shops WHERE id = $1', [params.id]);
    if (!shop) return error('Shop not found', 404);

    if (body.action === 'block') {
      await query("UPDATE shops SET status = 'blocked' WHERE id = $1", [params.id]);
    } else if (body.action === 'unblock') {
      await query("UPDATE shops SET status = 'active' WHERE id = $1", [params.id]);
    } else if (body.action === 'renew') {
      // body.renew: 'month' | '7' | '30' | '90', optional body.plan
      const base = shop.expiry_date && new Date(shop.expiry_date).getTime() > Date.now() ? new Date(shop.expiry_date) : new Date();
      let next = base;
      if (body.renew === 'month') next = addMonths(base, 1);
      else if (body.renew === '7') next = addDays(base, 7);
      else if (body.renew === '90') next = addDays(base, 90);
      else next = addDays(base, 30);
      let plan = shop.plan;
      let price = shop.price;
      if (body.plan && (PLANS as any)[body.plan]) {
        plan = body.plan as PlanKey;
        price = (PLANS as any)[plan].price;
      }
      await query("UPDATE shops SET expiry_date = $1, status = 'active', plan = $2, price = $3 WHERE id = $4", [next, plan, price, params.id]);
    } else {
      return error('Unknown action');
    }
    const updated = await queryOne('SELECT * FROM shops WHERE id = $1', [params.id]);
    return json({ ok: true, shop: updated });
  } catch (e: any) {
    return error(e.message || 'Database error', 500);
  }
}
