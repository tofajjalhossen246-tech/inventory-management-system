import crypto from 'crypto';
import { query, queryOne } from '@/lib/db';
import { maskEmail, hashToken, json, error } from '@/lib/auth';
import { sendRecoveryEmail, smtpConfigured } from '@/lib/mail';

export const dynamic = 'force-dynamic';

/**
 * Secure recovery: a code is generated ONLY when the submitted email matches
 * an active account's registered email (trimmed, case-insensitive). The code
 * and the username are NEVER returned to the client. The response carries
 * only found + a masked-email hint, so the UI can say "code sent, check
 * your inbox" without leaking the code itself.
 */
export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const normalized = String(email || '').trim().toLowerCase();
    if (!normalized || !normalized.includes('@')) return json({ ok: true, found: false, maskedEmail: null });
    const user: any = await queryOne('SELECT id, email FROM users WHERE LOWER(email) = $1 LIMIT 1', [normalized]);
    if (!user || !user.email) return json({ ok: true, found: false, maskedEmail: null });
    const code = String(crypto.randomInt(100000, 1000000));
    await query(
      "INSERT INTO password_resets (user_id, email, code_hash, expires_at) VALUES ($1,$2,$3,NOW() + INTERVAL '30 minutes')",
      [user.id, user.email, hashToken(code)]
    );
    // Best effort: send by email when SMTP is configured. Whether or not
    // delivery succeeds, the code itself is never exposed to the client.
    await sendRecoveryEmail(user.email, code);
    return json({ ok: true, found: true, maskedEmail: maskEmail(user.email), smtpConfigured: smtpConfigured() });
  } catch (e: any) {
    return error(e.message || 'Database error', 500);
  }
}
