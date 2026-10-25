import { getActor, requireShopActor, canManageProducts, json, error } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { isLocked } from '@/lib/subscription';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const actor = requireShopActor(await getActor(req));
    if (!canManageProducts(actor.role)) return error('Forbidden', 403);
    const shop: any = await queryOne('SELECT * FROM shops WHERE id = $1', [actor.shop_id]);
    if (isLocked(shop)) return error('Shop is locked (view only)', 403);
    const b = await req.json();
    await query(
      'UPDATE products SET name = COALESCE($1,name), sku = $2, category = $3, supplier = $4, selling_price = COALESCE($5,selling_price), stock = COALESCE($6,stock), low_stock_threshold = COALESCE($7,low_stock_threshold) WHERE id = $8 AND shop_id = $9',
      [b.name || null, b.sku ?? null, b.category ?? null, b.supplier ?? null, b.selling_price ?? null, b.stock ?? null, b.low_stock_threshold ?? null, params.id, actor.shop_id]
    );
    return json({ ok: true });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return error(e.message || 'Database error', 500);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const actor = requireShopActor(await getActor(req));
    if (!canManageProducts(actor.role)) return error('Forbidden', 403);
    await query('DELETE FROM products WHERE id = $1 AND shop_id = $2', [params.id, actor.shop_id]);
    return json({ ok: true });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return error(e.message || 'Database error', 500);
  }
}
