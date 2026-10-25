# Inventory Management System — Vercel-ready SaaS

Subscription-based, multi-shop inventory management for retail shops.
Admin, shop owners and employees each sign in with their own username and
password. Data is isolated per shop, and an admin can never read a shop's
products, stock, sales or team data from the admin account.

## Features

- Admin first-setup (scrypt-hashed password), then sign-in required.
- Admin sees ONLY subscription info: shop name, owner, phone, plan, price,
  expiry, status. Admin can manage, block/unblock and renew subscriptions.
  To view a shop's workspace, an admin must sign in separately with
  credentials given by that shop's owner.
- Admin creates a shop with an owner username/email/password. The owner
  sees only their own shop.
- Team tab (owner only): Manager, Cashier and view-only employees, each
  with a separate username/password. Server-enforced roles: a Cashier can
  record a sale but cannot create products; view-only users cannot change
  anything.
- Shop workspace: products, categories, suppliers, stock in/out, sales,
  low-stock alerts, transaction history, daily/monthly reports.
- Subscriptions: Trial free 14 days, Basic ৳499/month, Standard ৳999/month,
  Premium ৳1,999/month. An expired or blocked shop is locked to view-only;
  renewal (+1 month, +7/30/90 days, or a plan change) re-activates it.
- Manual payments: admin adds bKash/Nagad/Rocket numbers or bank accounts
  (bank name, branch, instructions). The shop Billing/Payment tab shows
  those methods; the shopkeeper submits plan + sender number + TrxID.
  Admin Payment Review approve auto-renews the subscription by 30 days;
  reject leaves it unchanged.
- Password recovery, securely: a code is generated ONLY when the submitted
  email matches an active account's registered email. The code and the
  username are NEVER returned to the client or shown on screen. The UI
  shows only a masked-email hint (for example `to***46@gmail.com`) and a
  "code sent, check your inbox" message in Bangla and English. A wrong
  code fails the reset.
- Language toggle EN / বাংলা, persisted in the browser.
- Professional clean design: desktop sidebar, large readable type,
  full-width layout, good contrast on light and dark surfaces, list-based
  layouts, no emoji decoration.

## 1. Put the code on GitHub

```bash
git init
git add .
git commit -m "Inventory SaaS"
git branch -M main
git remote add origin https://github.com/<your-username>/inventory-management-system.git
git push -u origin main
```

If the repository already exists and is empty, the same push works. Do
NOT commit a real `.env` file — only `.env.example` belongs in the repo.
`.gitignore` already excludes `node_modules/`, `.next/` and `.env`.

## 2. Create the database

Use any Postgres provider, for example Vercel Postgres, Neon or Supabase
(free tiers are enough to start). Copy its connection string, then run:

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

The schema creates shops, users, sessions, products, stock_movements,
payment_methods, payments and password_resets. Passwords are stored only
as scrypt hashes; recovery codes only as SHA-256 hashes.

## 3. Deploy on Vercel

Option A — from GitHub (recommended, auto-deploys on every push):

1. In Vercel, choose Add New → Project → Import the GitHub repository.
2. Framework preset: Next.js. Leave build command `next build` and
   output directory blank (Next.js default).
3. Add the environment variables from section 5, then Deploy.
4. Vercel gives you a `*.vercel.app` URL immediately.

Option B — from the command line:

```bash
npm install -g vercel
vercel
vercel --prod
```

## 4. Add a domain

- Free: use the `*.vercel.app` domain Vercel gives you.
- Custom domain: Vercel → Project → Settings → Domains → Add, then add
  the DNS records Vercel shows at your domain registrar (an A record or
  CNAME, as instructed there). Buying a domain through Vercel is a paid,
  non-refundable purchase — check the price Vercel quotes before buying.
- HTTPS is provided automatically by Vercel; do not disable it, because
  session cookies are marked Secure in production.

## 5. Environment variables (Vercel → Project → Settings → Environment Variables)

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres connection string, e.g. `postgres://user:password@host:5432/dbname?sslmode=require` |
| `SMTP_HOST` | No, for real email | SMTP host for recovery emails |
| `SMTP_PORT` | No | SMTP port, usually 587 (465 for SSL) |
| `SMTP_USER` | No | SMTP username |
| `SMTP_PASS` | No | SMTP password / app password |
| `SMTP_FROM` | No | Sender address shown in recovery emails |

**Important — email delivery:** if no SMTP variables are set, recovery
codes are stored server-side only and are NEVER displayed on screen, so
a user cannot actually receive the code by email yet. Connect SMTP
before selling to real shop owners. Until then, a shop owner can reset an
employee's password from the Team tab, and an admin can create a fresh
owner login when a shop is created.

After changing environment variables, redeploy in Vercel (Deployments →
⋯ → Redeploy) so the new values take effect.

## 6. First run checklist

1. Open the deployed URL. You will see "Create admin account" — create
   the admin username/password and keep them safe.
2. Sign in as admin, add a payment method (bKash/bank), then create a
   shop with its owner username/email/password.
3. Sign out, sign in as that owner, add a product, record a sale, and
   check Reports and the low-stock alert.
4. In the shop Billing tab, submit a test payment; as admin, approve it
   in Payment Review and confirm the shop expiry moves forward 30 days.
5. Test recovery: request a code with the owner's registered email and
   confirm the UI shows only the masked hint, never the code itself.

## Tech notes

- Next.js App Router + TypeScript, `pg` client only (no native binaries),
  so Vercel builds work without extra system packages.
- All shop data queries are filtered by `shop_id` from the session, and
  admin sessions are rejected by shop APIs server-side — hiding buttons
  in the UI alone is not the security boundary.
- No secrets, real passwords or real email addresses are in this code.
  Replace the example values in `.env.example` with your own secrets in
  Vercel, never in Git.
