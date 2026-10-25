export const PLANS = {
  trial: { label: 'Trial', price: 0, days: 14 },
  basic: { label: 'Basic', price: 499, days: 30 },
  standard: { label: 'Standard', price: 999, days: 30 },
  premium: { label: 'Premium', price: 1999, days: 30 }
} as const;

export type PlanKey = keyof typeof PLANS;

export function planPrice(plan: string): number {
  return (PLANS as any)[plan]?.price ?? 0;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

/** A shop is locked when blocked, or when its expiry date has passed. */
export function isLocked(shop: { status: string; expiry_date: string | null }): boolean {
  if (shop.status === 'blocked') return true;
  if (!shop.expiry_date) return false;
  return new Date(shop.expiry_date).getTime() < Date.now();
}
