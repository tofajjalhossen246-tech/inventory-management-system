import { getActor, requireShopActor, json, error } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { planPrice, PLANS } from '@/lib/subscription';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const actor = requireShopActor(await getActor(req));
    const methods = await query('SELECT * FROM payment_methods WHERE active = TRUE ORDER BY created_at ASC');
    const payments = await query('SELECT * FROM payments WHERE shop_id = $1 ORDER BY created_at DESC', [actor.shop_id]);
    return json({ ok: true, methods, payments });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return error(e.message || 'Database error', 500);
  }
}

export async function POST(req: Request) {
  try {
    const actor = requireShopActor(await getActor(req));
    const { plan, method_id, sender_number, trxid } = await req.json();
    if (!(PLANS as any)[plan]) return error('Choose a valid plan');
    if (!sender_number || !trxid) return error('Sender number and TrxID are required');
    const row: any = await queryOne(
      'INSERT INTO payments (shop_id, method_id, plan, amount, sender_number, trxid) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [actor.shop_id, method_id || null, plan, planPrice(plan), sender_number.trim(), trxid.trim()]
    );
    return json({ ok: true, payment: row }, 201);
  } catch (e: any) {
    if (e instanceof Response) return e;
    return error(e.message || 'Database error', 500);
  }
}
