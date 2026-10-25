import { getActor, requireShopActor, canSell, canManageProducts, json, error } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { isLocked } from '@/lib/subscription';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const actor = requireShopActor(await getActor(req));
    const shop: any = await queryOne('SELECT * FROM shops WHERE id = $1', [actor.shop_id]);
    if (isLocked(shop)) return error('Shop is locked (view only)', 403);
    const { productId, type, qty, note } = await req.json();
    const q = Number(qty);
    if (!productId || !q || q <= 0) return error('Product and a positive quantity are required');
    if (type === 'sale' && !canSell(actor.role)) return error('Forbidden', 403);
    if (type !== 'sale' && !canManageProducts(actor.role)) return error('Forbidden: your role cannot adjust stock', 403);
    const product: any = await queryOne('SELECT * FROM products WHERE id = $1 AND shop_id = $2', [productId, actor.shop_id]);
    if (!product) return error('Product not found', 404);
    let newStock = product.stock;
    if (type === 'in') newStock += q;
    else if (type === 'sale' || type === 'adjustment') newStock -= q;
    if (newStock < 0) return error('Not enough stock', 400);
    await query('UPDATE products SET stock = $1 WHERE id = $2', [newStock, productId]);
    await query(
      'INSERT INTO stock_movements (shop_id, product_id, product_name, type, qty, unit_price, note, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [actor.shop_id, productId, product.name, type, q, product.selling_price, note || null, actor.id]
    );
    return json({ ok: true, stock: newStock });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return error(e.message || 'Database error', 500);
  }
}
