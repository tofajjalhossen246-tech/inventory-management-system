import { getActor, requireShopActor, canManageProducts, json, error } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { isLocked } from '@/lib/subscription';

export const dynamic = 'force-dynamic';

async function shopFor(actor: any) {
  const shop: any = await queryOne('SELECT * FROM shops WHERE id = $1', [actor.shop_id]);
  return shop;
}

export async function GET(req: Request) {
  try {
    const actor = requireShopActor(await getActor(req));
    const rows = await query('SELECT * FROM products WHERE shop_id = $1 ORDER BY created_at DESC', [actor.shop_id]);
    return json({ ok: true, products: rows });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return error(e.message || 'Database error', 500);
  }
}

export async function POST(req: Request) {
  try {
    const actor = requireShopActor(await getActor(req));
    if (!canManageProducts(actor.role)) return error('Forbidden: your role cannot create products', 403);
    const shop = await shopFor(actor);
    if (isLocked(shop)) return error('Shop is locked: subscription expired or blocked (view only)', 403);
    const { name, sku, category, supplier, selling_price, stock, low_stock_threshold } = await req.json();
    if (!name) return error('Product name is required');
    const row: any = await queryOne(
      'INSERT INTO products (shop_id, name, sku, category, supplier, selling_price, stock, low_stock_threshold) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [actor.shop_id, name.trim(), sku || null, category || null, supplier || null, Number(selling_price || 0), Number(stock || 0), Number(low_stock_threshold ?? 5)]
    );
    return json({ ok: true, product: row }, 201);
  } catch (e: any) {
    if (e instanceof Response) return e;
    return error(e.message || 'Database error', 500);
  }
}
