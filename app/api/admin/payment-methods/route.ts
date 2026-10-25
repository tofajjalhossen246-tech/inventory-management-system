import { getActor, json, error } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const actor = await getActor(req);
    if (!actor || actor.role !== 'admin') return error('Forbidden', 403);
    const rows = await query('SELECT * FROM payment_methods ORDER BY created_at ASC');
    return json({ ok: true, methods: rows });
  } catch (e: any) {
    return error(e.message || 'Database error', 500);
  }
}

export async function POST(req: Request) {
  try {
    const actor = await getActor(req);
    if (!actor || actor.role !== 'admin') return error('Forbidden', 403);
    const { label, type, account_number, bank_name, branch, instructions } = await req.json();
    if (!label || !type) return error('Label and type are required');
    const row: any = await queryOne(
      'INSERT INTO payment_methods (label, type, account_number, bank_name, branch, instructions) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [label, type, account_number || null, bank_name || null, branch || null, instructions || null]
    );
    return json({ ok: true, method: row }, 201);
  } catch (e: any) {
    return error(e.message || 'Database error', 500);
  }
}
