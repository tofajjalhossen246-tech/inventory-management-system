import crypto from 'crypto';
import { queryOne } from './db';

export type Role = 'admin' | 'owner' | 'manager' | 'cashier' | 'viewer';

export interface Actor {
  id: string;
  username: string;
  email: string | null;
  role: Role;
  shop_id: string | null;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(derived, 'hex'));
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function newToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***@***';
  const visible = local.slice(0, 2);
  return `${visible}***${local.slice(-2)}@${domain}`;
}

export function getTokenFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const part = cookieHeader.split(';').map((s) => s.trim()).find((s) => s.startsWith('session='));
  if (!part) return null;
  return decodeURIComponent(part.slice('session='.length)) || null;
}

export async function getActor(req: Request): Promise<Actor | null> {
  const token = getTokenFromCookie(req.headers.get('cookie'));
  if (!token) return null;
  const row: any = await queryOne(
    `SELECT u.id, u.username, u.email, u.role, u.shop_id
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > NOW()`,
    [hashToken(token)]
  );
  if (!row) return null;
  return { id: row.id, username: row.username, email: row.email, role: row.role as Role, shop_id: row.shop_id };
}

export function sessionCookie(token: string): string {
  // 7-day session. Secure flag is set in production (Vercel is HTTPS).
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${secure}`;
}

export function clearSessionCookie(): string {
  return 'session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
}

export function json(data: any, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders }
  });
}

export function error(message: string, status = 400): Response {
  return json({ ok: false, error: message }, status);
}

/** Shop access: admins are NEVER allowed through shop APIs. */
export function requireShopActor(actor: Actor | null): Actor {
  if (!actor) throw new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), { status: 401 });
  if (actor.role === 'admin' || !actor.shop_id) {
    throw new Response(JSON.stringify({ ok: false, error: 'forbidden' }), { status: 403 });
  }
  return actor;
}

export function canManageProducts(role: Role): boolean {
  return role === 'owner' || role === 'manager';
}
export function canSell(role: Role): boolean {
  return role === 'owner' || role === 'manager' || role === 'cashier';
}
export function canManageTeam(role: Role): boolean {
  return role === 'owner';
}
export function isViewOnly(role: Role): boolean {
  return role === 'viewer';
}
