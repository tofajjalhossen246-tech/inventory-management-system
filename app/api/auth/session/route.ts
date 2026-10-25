import { getActor, json, error } from '@/lib/auth';
import { queryOne } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const actor = await getActor(req);
    if (!actor) return json({ ok: true, user: null });
    let shop = null;
    if (actor.shop_id) {
      shop = await queryOne('SELECT id, name, plan, price, status, expiry_date FROM shops WHERE id = $1', [actor.shop_id]);
    }
    return json({ ok: true, user: actor, shop });
  } catch (e: any) {
    return error(e.message || 'Database error', 500);
  }
}
