import { query, queryOne } from '@/lib/db';
import { hashPassword, hashToken, json, error } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email, code, newPassword } = await req.json();
    if (!newPassword || newPassword.length < 6) return error('New password must be at least 6 characters');
    const normalized = String(email || '').trim().toLowerCase();
    const row: any = await queryOne(
      `SELECT * FROM password_resets
       WHERE LOWER(email) = $1 AND code_hash = $2 AND used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [normalized, hashToken(String(code || '').trim())]
    );
    if (!row) return error('wrong_code', 400);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashPassword(newPassword), row.user_id]);
    await query('UPDATE password_resets SET used = TRUE WHERE id = $1', [row.id]);
    await query('DELETE FROM sessions WHERE user_id = $1', [row.user_id]);
    return json({ ok: true });
  } catch (e: any) {
    return error(e.message || 'Database error', 500);
  }
}
