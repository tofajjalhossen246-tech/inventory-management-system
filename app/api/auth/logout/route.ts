import { getTokenFromCookie, hashToken, clearSessionCookie, json } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const token = getTokenFromCookie(req.headers.get('cookie'));
  if (token) {
    try { await query('DELETE FROM sessions WHERE token_hash = $1', [hashToken(token)]); } catch {}
  }
  return json({ ok: true }, 200, { 'Set-Cookie': clearSessionCookie() });
}
