import { getActor, json, error } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const actor = await getActor(req);
    if (!actor || actor.role !== 'admin') return error('Forbidden', 403);
    const b = await req.json();
    await query(
      'UPDATE payment_methods SET label = COALESCE($1,label), type = COALESCE($2,type), account_number = $3, bank_name = $4, branch = $5, instructions = $6, active = COALESCE($7,active) WHERE id = $8',
      [b.label || null, b.type || null, b.account_number ?? null, b.bank_name ?? null, b.branch ?? null, b.instructions ?? null, b.active ?? null, params.id]
    );
    return json({ ok: true });
  } catch (e: any) {
    return error(e.message || 'Database error', 500);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const actor = await getActor(req);
    if (!actor || actor.role !== 'admin') return error('Forbidden', 403);
    await query('DELETE FROM payment_methods WHERE id = $1', [params.id]);
    return json({ ok: true });
  } catch (e: any) {
    return error(e.message || 'Database error', 500);
  }
}
