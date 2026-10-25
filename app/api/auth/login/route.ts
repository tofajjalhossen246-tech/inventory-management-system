import { query, queryOne } from '@/lib/db';
import { verifyPassword, newToken, hashToken, sessionCookie, json, error } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) return error('Username and password are required');
    const user: any = await queryOne('SELECT * FROM users WHERE username = $1', [username.trim()]);
    if (!user || !verifyPassword(password, user.password_hash)) return error('Invalid username or password', 401);
    const token = newToken();
    await query('INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1,$2,NOW() + INTERVAL \'7 days\')', [user.id, hashToken(token)]);
    return json({ ok: true, user: { id: user.id, username: user.username, email: user.email, role: user.role, shop_id: user.shop_id } }, 200, { 'Set-Cookie': sessionCookie(token) });
  } catch (e: any) {
    return error(e.message || 'Database error', 500);
  }
}
