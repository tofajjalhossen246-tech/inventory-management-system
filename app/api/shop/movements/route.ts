import { getActor, requireShopActor, json, error } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const actor = requireShopActor(await getActor(req));
    const url = new URL(req.url);
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const type = url.searchParams.get('type');
    const params: any[] = [actor.shop_id];
    let sql = 'SELECT * FROM stock_movements WHERE shop_id = $1';
    if (from) { params.push(from); sql += ` AND created_at >= $${params.length}`; }
    if (to) { params.push(to); sql += ` AND created_at <= $${params.length}`; }
    if (type) { params.push(type); sql += ` AND type = $${params.length}`; }
    sql += ' ORDER BY created_at DESC LIMIT 500';
    const rows = await query(sql, params);
    return json({ ok: true, movements: rows });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return error(e.message || 'Database error', 500);
  }
}
