import { query, queryOne } from '@/lib/db';
import { hashPassword, newToken, hashToken, sessionCookie, json, error } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const row: any = await queryOne('SELECT COUNT(*)::int AS c FROM users WHERE role = $1', ['admin']);
    return json({ ok: true, adminExists: (row?.c ?? 0) > 0 });
  } catch (e: any) {
    return error(e.message || 'Database error', 500);
  }
}

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    if (!username || !password || password.length < 6) return error('Username and a password of at least 6 characters are required');
    const existing: any = await queryOne('SELECT id FROM users WHERE role = $1 LIMIT 1', ['admin']);
    if (existing) return error('Admin already exists', 409);
    const user: any = await queryOne(
      'INSERT INTO users (username, password_hash, role) VALUES ($1,$2,$3) RETURNING id, username, role',
      [username.trim(), hashPassword(password), 'admin']
    );
    const token = newToken();
    await query('INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1,$2,NOW() + INTERVAL \'7 days\')', [user.id, hashToken(token)]);
    return json({ ok: true, user }, 200, { 'Set-Cookie': sessionCookie(token) });
  } catch (e: any) {
    return error(e.message || 'Database error', 500);
  }
}
