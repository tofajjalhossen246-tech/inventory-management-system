'use client';

import { useEffect, useState } from 'react';

type Lang = 'en' | 'bn';
const DICT: Record<string, Record<Lang, string>> = {
  title: { en: 'Inventory Management System', bn: 'ইনভেন্টরি ম্যানেজমেন্ট সিস্টেম' },
  login: { en: 'Sign in', bn: 'সাইন ইন' },
  username: { en: 'Username', bn: 'ইউজারনেম' },
  password: { en: 'Password', bn: 'পাসওয়ার্ড' },
  email: { en: 'Email', bn: 'ইমেইল' },
  logout: { en: 'Log out', bn: 'লগ আউট' },
  adminPanel: { en: 'Admin Panel', bn: 'অ্যাডমিন প্যানেল' },
  shops: { en: 'Shops', bn: 'দোকান' },
  products: { en: 'Products', bn: 'পণ্য' },
  stockSales: { en: 'Stock & Sales', bn: 'স্টক ও বিক্রি' },
  reports: { en: 'Reports', bn: 'রিপোর্ট' },
  team: { en: 'Team', bn: 'টিম' },
  billing: { en: 'Billing / Payment', bn: 'বিলিং / পেমেন্ট' },
  paymentMethods: { en: 'Payment Methods (Manual)', bn: 'পেমেন্ট মাধ্যম (ম্যানুয়াল)' },
  paymentReview: { en: 'Payment Review', bn: 'পেমেন্ট রিভিউ' },
  changePassword: { en: 'Change Password', bn: 'পাসওয়ার্ড পরিবর্তন' },
  createShop: { en: 'Create Shop', bn: 'দোকান তৈরি করুন' },
  addProduct: { en: 'Add Product', bn: 'পণ্য যোগ করুন' },
  lowStock: { en: 'Low stock alerts', bn: 'কম স্টক সতর্কতা' },
  locked: { en: 'This shop is locked: subscription expired or blocked. Viewing only.', bn: 'এই দোকানটি লক করা: সাবস্ক্রিপশনের মেয়াদ শেষ বা ব্লক করা হয়েছে। শুধু দেখা যাবে।' },
  recovery: { en: 'Password recovery', bn: 'পাসওয়ার্ড রিকভারি' },
  forgot: { en: 'Forgot password?', bn: 'পাসওয়ার্ড ভুলে গেছেন?' },
  backToSignIn: { en: 'Back to sign in', bn: 'সাইন ইনে ফিরুন' },
  getCode: { en: 'Get recovery code', bn: 'রিকভারি কোড নিন' },
  setNewPassword: { en: 'Set new password', bn: 'নতুন পাসওয়ার্ড সেট করুন' },
  newPassword: { en: 'New password', bn: 'নতুন পাসওয়ার্ড' },
  recoveryCode: { en: 'Recovery code', bn: 'রিকভারি কোড' }
};
function t(lang: Lang, key: string): string { return DICT[key]?.[lang] || key; }
async function api(path: string, method = 'GET', body?: any) {
  const res = await fetch(path, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}
function fmtDate(v: any) { if (!v) return '-'; return new Date(v).toLocaleDateString(); }
function isLockedShop(shop: any) {
  if (!shop) return false;
  if (shop.status === 'blocked') return true;
  return shop.expiry_date ? new Date(shop.expiry_date).getTime() < Date.now() : false;
}

export default function Home() {
  const [lang, setLang] = useState<Lang>('en');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);
  const [adminExists, setAdminExists] = useState(true);
  const [screen, setScreen] = useState<'login' | 'setup' | 'recovery'>('login');
  const [adminTab, setAdminTab] = useState('shops');
  const [shopTab, setShopTab] = useState('products');
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  const [shops, setShops] = useState<any[]>([]);
  const [methods, setMethods] = useState<any[]>([]);
  const [adminPayments, setAdminPayments] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [shopPayments, setShopPayments] = useState<any[]>([]);
  const [shopMethods, setShopMethods] = useState<any[]>([]);

  const [form, setForm] = useState<any>({});
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  useEffect(() => {
    try { const saved = localStorage.getItem('lang'); if (saved === 'bn' || saved === 'en') setLang(saved); } catch {}
    (async () => {
      try {
        const s = await api('/api/auth/session');
        if (s.user) { setUser(s.user); setShop(s.shop); }
        else {
          const setup = await api('/api/setup');
          setAdminExists(setup.adminExists);
          setScreen(setup.adminExists ? 'login' : 'setup');
        }
      } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => { try { localStorage.setItem('lang', lang); } catch {} }, [lang]);

  async function refreshAdmin() {
    const [s, m, p] = await Promise.all([api('/api/admin/shops'), api('/api/admin/payment-methods'), api('/api/admin/payments')]);
    setShops(s.shops); setMethods(m.methods); setAdminPayments(p.payments);
  }
  async function refreshShop() {
    const [p, mv, tm, pay] = await Promise.all([api('/api/shop/products'), api('/api/shop/movements'), api('/api/shop/team'), api('/api/shop/payments')]);
    setProducts(p.products); setMovements(mv.movements); setTeam(tm.team); setShopMethods(pay.methods); setShopPayments(pay.payments);
    const s = await api('/api/auth/session'); setShop(s.shop);
  }
  useEffect(() => { if (user?.role === 'admin') refreshAdmin().catch((e) => setErr(e.message)); if (user?.shop_id) refreshShop().catch((e) => setErr(e.message)); }, [user]); // eslint-disable-line

  async function doLogin(e: any) {
    e.preventDefault(); setErr('');
    try { const r = await api('/api/auth/login', 'POST', { username: form.username, password: form.password }); setUser(r.user); window.location.reload(); }
    catch (e: any) { setErr(e.message); }
  }
  async function doSetup(e: any) {
    e.preventDefault(); setErr('');
    try { await api('/api/setup', 'POST', { username: form.username, password: form.password }); window.location.reload(); }
    catch (e: any) { setErr(e.message); }
  }
  async function doLogout() { await api('/api/auth/logout', 'POST'); window.location.reload(); }

  if (loading) return <main className="center"><p>Loading… / লোড হচ্ছে…</p></main>;

  const header = (
    <header className="topbar">
      <div className="brand">{t(lang, 'title')}</div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div className="lang-toggle">
          <button className={lang === 'en' ? '' : 'secondary'} onClick={() => setLang('en')}>EN</button>
          <button className={lang === 'bn' ? '' : 'secondary'} onClick={() => setLang('bn')}>বাংলা</button>
        </div>
        {user && <span>{user.username} ({user.role})</span>}
        {user && <button className="secondary" onClick={doLogout}>{t(lang, 'logout')}</button>}
      </div>
    </header>
  );

  if (!user) {
    return (
      <div>
        {header}
        <main className="center">
          <div className="card">
            {screen === 'recovery' ? (
              <Recovery lang={lang} onBack={() => setScreen(adminExists ? 'login' : 'setup')} />
            ) : (
              <form onSubmit={screen === 'setup' ? doSetup : doLogin}>
                <h1>{screen === 'setup' ? 'Create admin account' : t(lang, 'login')}</h1>
                <p>{screen === 'setup' ? 'First time setup: create the admin username and password. After this, sign-in is required.' : ''}</p>
                <label>{t(lang, 'username')}</label>
                <input value={form.username || ''} onChange={(e) => set('username', e.target.value)} required />
                <label>{t(lang, 'password')}</label>
                <input type="password" value={form.password || ''} onChange={(e) => set('password', e.target.value)} required />
                {err && <p className="error">{err}</p>}
                <button style={{ marginTop: 16, width: '100%' }} type="submit">{screen === 'setup' ? 'Create admin' : t(lang, 'login')}</button>
                <p><button type="button" className="secondary" style={{ width: '100%', marginTop: 12 }} onClick={() => setScreen('recovery')}>{t(lang, 'forgot')}</button></p>
              </form>
            )}
          </div>
        </main>
      </div>
    );
  }

  if (user.role === 'admin') {
    return (
      <div>
        {header}
        <div className="shell">
          <aside className="sidebar">
            <p><b>{t(lang, 'adminPanel')}</b></p>
            <p style={{ color: 'var(--muted)' }}>Admin sees subscription info only. Admin cannot open a shop workspace. To view a shop, sign in separately with credentials given by its owner.</p>
            <button className={adminTab === 'shops' ? 'active' : ''} onClick={() => setAdminTab('shops')}>{t(lang, 'shops')}</button>
            <button className={adminTab === 'methods' ? 'active' : ''} onClick={() => setAdminTab('methods')}>{t(lang, 'paymentMethods')}</button>
            <button className={adminTab === 'payments' ? 'active' : ''} onClick={() => setAdminTab('payments')}>{t(lang, 'paymentReview')}</button>
            <button className={adminTab === 'password' ? 'active' : ''} onClick={() => setAdminTab('password')}>{t(lang, 'changePassword')}</button>
          </aside>
          <main className="main">
            {err && <p className="error">{err}</p>}
            {msg && <p>{msg}</p>}
            {adminTab === 'shops' && (
              <div>
                <div className="card">
                  <h2>{t(lang, 'createShop')}</h2>
                  <div className="form-row">
                    <div><label>Shop name</label><input value={form.shopName || ''} onChange={(e) => set('shopName', e.target.value)} /></div>
                    <div><label>Owner phone</label><input value={form.ownerPhone || ''} onChange={(e) => set('ownerPhone', e.target.value)} /></div>
                    <div><label>Owner username</label><input value={form.ownerUsername || ''} onChange={(e) => set('ownerUsername', e.target.value)} /></div>
                    <div><label>Owner email</label><input value={form.ownerEmail || ''} onChange={(e) => set('ownerEmail', e.target.value)} /></div>
                    <div><label>Owner password</label><input type="password" value={form.ownerPassword || ''} onChange={(e) => set('ownerPassword', e.target.value)} /></div>
                    <div><label>Plan</label><select value={form.plan || 'trial'} onChange={(e) => set('plan', e.target.value)}><option value="trial">Trial free 14 days</option><option value="basic">Basic ৳499/month</option><option value="standard">Standard ৳999/month</option><option value="premium">Premium ৳1,999/month</option></select></div>
                  </div>
                  <button style={{ marginTop: 16 }} onClick={async () => { try { await api('/api/admin/shops', 'POST', { name: form.shopName, ownerPhone: form.ownerPhone, ownerUsername: form.ownerUsername, ownerEmail: form.ownerEmail, ownerPassword: form.ownerPassword, plan: form.plan || 'trial' }); setMsg('Shop created'); await refreshAdmin(); } catch (e: any) { setErr(e.message); } }}>{t(lang, 'createShop')}</button>
                </div>
                <div className="card">
                  <h2>Subscribed shops (subscription info only)</h2>
                  <table><thead><tr><th>Shop</th><th>Owner</th><th>Phone</th><th>Plan</th><th>Price</th><th>Expiry</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>{shops.map((s: any) => (
                      <tr key={s.id}><td>{s.name}</td><td>{s.owner_username || '-'}</td><td>{s.owner_phone || '-'}</td><td>{s.plan}</td><td>৳{s.price}</td><td>{fmtDate(s.expiry_date)}</td><td><span className="badge">{s.status}</span></td>
                        <td>
                          <button className="secondary" onClick={async () => { await api(`/api/admin/shops/${s.id}`, 'PATCH', { action: 'renew', renew: 'month' }); await refreshAdmin(); }}>Renew +1 month</button>{' '}
                          <button className="secondary" onClick={async () => { await api(`/api/admin/shops/${s.id}`, 'PATCH', { action: s.status === 'blocked' ? 'unblock' : 'block' }); await refreshAdmin(); }}>{s.status === 'blocked' ? 'Unblock' : 'Block'}</button>
                        </td></tr>
                    ))}</tbody></table>
                </div>
              </div>
            )}
            {adminTab === 'methods' && (
              <div className="card">
                <h2>{t(lang, 'paymentMethods')}</h2>
                <div className="form-row">
                  <div><label>Label</label><input value={form.methodLabel || ''} onChange={(e) => set('methodLabel', e.target.value)} placeholder="bKash personal" /></div>
                  <div><label>Type</label><select value={form.methodType || 'bkash'} onChange={(e) => set('methodType', e.target.value)}><option value="bkash">bKash</option><option value="nagad">Nagad</option><option value="rocket">Rocket</option><option value="bank">Bank</option></select></div>
                  <div><label>Account number</label><input value={form.methodAccount || ''} onChange={(e) => set('methodAccount', e.target.value)} /></div>
                  <div><label>Bank name</label><input value={form.methodBank || ''} onChange={(e) => set('methodBank', e.target.value)} /></div>
                  <div><label>Branch</label><input value={form.methodBranch || ''} onChange={(e) => set('methodBranch', e.target.value)} /></div>
                  <div><label>Instructions</label><input value={form.methodInstructions || ''} onChange={(e) => set('methodInstructions', e.target.value)} /></div>
                </div>
                <button style={{ marginTop: 16 }} onClick={async () => { try { await api('/api/admin/payment-methods', 'POST', { label: form.methodLabel, type: form.methodType || 'bkash', account_number: form.methodAccount, bank_name: form.methodBank, branch: form.methodBranch, instructions: form.methodInstructions }); await refreshAdmin(); } catch (e: any) { setErr(e.message); } }}>Add method</button>
                <table style={{ marginTop: 20 }}><thead><tr><th>Label</th><th>Type</th><th>Account</th><th>Bank / Branch</th><th>Action</th></tr></thead>
                  <tbody>{methods.map((m: any) => <tr key={m.id}><td>{m.label}</td><td>{m.type}</td><td>{m.account_number || '-'}</td><td>{m.bank_name || ''} {m.branch || ''}</td><td><button className="danger" onClick={async () => { await api(`/api/admin/payment-methods/${m.id}`, 'DELETE'); await refreshAdmin(); }}>Delete</button></td></tr>)}</tbody></table>
              </div>
            )}
            {adminTab === 'payments' && (
              <div className="card"><h2>{t(lang, 'paymentReview')}</h2>
                <table><thead><tr><th>Shop</th><th>Plan</th><th>Amount</th><th>Sender</th><th>TrxID</th><th>Status</th><th>Action</th></tr></thead>
                  <tbody>{adminPayments.map((p: any) => <tr key={p.id}><td>{p.shop_name}</td><td>{p.plan}</td><td>৳{p.amount}</td><td>{p.sender_number}</td><td>{p.trxid}</td><td>{p.status}</td><td>{p.status === 'pending' && <><button onClick={async () => { await api('/api/admin/payments', 'PATCH', { id: p.id, action: 'approve' }); await refreshAdmin(); }}>Approve</button>{' '}<button className="secondary" onClick={async () => { await api('/api/admin/payments', 'PATCH', { id: p.id, action: 'reject' }); await refreshAdmin(); }}>Reject</button></>}</td></tr>)}</tbody></table>
                <p>Approve auto-renews the shop subscription by 30 days.</p>
              </div>
            )}
            {adminTab === 'password' && <PasswordForm />}
          </main>
        </div>
      </div>
    );
  }

  // Shop workspace
  const locked = isLockedShop(shop);
  const low = products.filter((p: any) => p.stock <= p.low_stock_threshold);
  const today = new Date().toISOString().slice(0, 10);
  const month = today.slice(0, 7);
  const salesToday = movements.filter((m: any) => m.type === 'sale' && String(m.created_at).slice(0, 10) === today).reduce((s: number, m: any) => s + Number(m.qty) * Number(m.unit_price), 0);
  const salesMonth = movements.filter((m: any) => m.type === 'sale' && String(m.created_at).slice(0, 7) === month).reduce((s: number, m: any) => s + Number(m.qty) * Number(m.unit_price), 0);
  const stockValue = products.reduce((s: number, p: any) => s + Number(p.stock) * Number(p.selling_price), 0);

  return (
    <div>
      {header}
      <div className="shell">
        <aside className="sidebar">
          <p><b>{shop?.name || 'Shop'}</b></p>
          <p>Plan: {shop?.plan} • Expiry: {fmtDate(shop?.expiry_date)} • Status: {shop?.status}</p>
          <button className={shopTab === 'products' ? 'active' : ''} onClick={() => setShopTab('products')}>{t(lang, 'products')}</button>
          <button className={shopTab === 'stock' ? 'active' : ''} onClick={() => setShopTab('stock')}>{t(lang, 'stockSales')}</button>
          <button className={shopTab === 'reports' ? 'active' : ''} onClick={() => setShopTab('reports')}>{t(lang, 'reports')}</button>
          <button className={shopTab === 'team' ? 'active' : ''} onClick={() => setShopTab('team')}>{t(lang, 'team')}</button>
          <button className={shopTab === 'billing' ? 'active' : ''} onClick={() => setShopTab('billing')}>{t(lang, 'billing')}</button>
          <button className={shopTab === 'password' ? 'active' : ''} onClick={() => setShopTab('password')}>{t(lang, 'changePassword')}</button>
        </aside>
        <main className="main">
          {locked && <div className="alert">{t(lang, 'locked')}</div>}
          {err && <p className="error">{err}</p>}
          {msg && <p>{msg}</p>}
          <div className="grid cols4">
            <div className="card stat"><span>Products</span><b>{products.length}</b></div>
            <div className="card stat"><span>Stock value</span><b>৳{stockValue.toFixed(0)}</b></div>
            <div className="card stat"><span>Sales today</span><b>৳{salesToday.toFixed(0)}</b></div>
            <div className="card stat"><span>Sales this month</span><b>৳{salesMonth.toFixed(0)}</b></div>
          </div>
          {low.length > 0 && <div className="card"><h3>{t(lang, 'lowStock')}</h3><ul>{low.map((p: any) => <li key={p.id}>{p.name} — {p.stock} left (threshold {p.low_stock_threshold})</li>)}</ul></div>}

          {shopTab === 'products' && (
            <div className="card">
              <h2>{t(lang, 'products')}</h2>
              {!locked && (user.role === 'owner' || user.role === 'manager') && (
                <div className="form-row">
                  <div><label>Name</label><input value={form.pName || ''} onChange={(e) => set('pName', e.target.value)} /></div>
                  <div><label>Category</label><input value={form.pCategory || ''} onChange={(e) => set('pCategory', e.target.value)} /></div>
                  <div><label>Supplier</label><input value={form.pSupplier || ''} onChange={(e) => set('pSupplier', e.target.value)} /></div>
                  <div><label>Price</label><input type="number" value={form.pPrice || ''} onChange={(e) => set('pPrice', e.target.value)} /></div>
                  <div><label>Stock</label><input type="number" value={form.pStock || ''} onChange={(e) => set('pStock', e.target.value)} /></div>
                  <div><label>Low stock threshold</label><input type="number" value={form.pThreshold || ''} onChange={(e) => set('pThreshold', e.target.value)} /></div>
                </div>
              )}
              {!locked && (user.role === 'owner' || user.role === 'manager') && <button style={{ marginTop: 12 }} onClick={async () => { try { await api('/api/shop/products', 'POST', { name: form.pName, category: form.pCategory, supplier: form.pSupplier, selling_price: form.pPrice, stock: form.pStock, low_stock_threshold: form.pThreshold }); await refreshShop(); } catch (e: any) { setErr(e.message); } }}>{t(lang, 'addProduct')}</button>}
              <table style={{ marginTop: 20 }}><thead><tr><th>Name</th><th>Category</th><th>Supplier</th><th>Price</th><th>Stock</th></tr></thead>
                <tbody>{products.map((p: any) => <tr key={p.id}><td>{p.name}</td><td>{p.category || '-'}</td><td>{p.supplier || '-'}</td><td>৳{p.selling_price}</td><td>{p.stock}</td></tr>)}</tbody></table>
            </div>
          )}

          {shopTab === 'stock' && (
            <div className="card"><h2>{t(lang, 'stockSales')}</h2>
              <div className="form-row">
                <div><label>Product</label><select value={form.stockProduct || ''} onChange={(e) => set('stockProduct', e.target.value)}><option value="">Select product</option>{products.map((p: any) => <option key={p.id} value={p.id}>{p.name} ({p.stock})</option>)}</select></div>
                <div><label>Type</label><select value={form.stockType || 'sale'} onChange={(e) => set('stockType', e.target.value)}><option value="sale">Sale</option><option value="in">Stock in (purchase)</option></select></div>
                <div><label>Quantity</label><input type="number" value={form.stockQty || ''} onChange={(e) => set('stockQty', e.target.value)} /></div>
                <div><label>Note</label><input value={form.stockNote || ''} onChange={(e) => set('stockNote', e.target.value)} /></div>
              </div>
              <button style={{ marginTop: 12 }} disabled={locked} onClick={async () => { try { await api('/api/shop/stock', 'POST', { productId: form.stockProduct, type: form.stockType || 'sale', qty: form.stockQty, note: form.stockNote }); await refreshShop(); } catch (e: any) { setErr(e.message); } }}>Record</button>
              <h3 style={{ marginTop: 24 }}>Transaction history</h3>
              <table><thead><tr><th>Date</th><th>Product</th><th>Type</th><th>Qty</th><th>Unit price</th></tr></thead>
                <tbody>{movements.slice(0, 100).map((m: any) => <tr key={m.id}><td>{new Date(m.created_at).toLocaleString()}</td><td>{m.product_name}</td><td>{m.type}</td><td>{m.qty}</td><td>৳{m.unit_price}</td></tr>)}</tbody></table>
            </div>
          )}

          {shopTab === 'reports' && (
            <div className="card"><h2>{t(lang, 'reports')}</h2>
              <p>Daily sales (today): ৳{salesToday.toFixed(2)}</p>
              <p>Monthly sales ({month}): ৳{salesMonth.toFixed(2)}</p>
              <p>Total stock value: ৳{stockValue.toFixed(2)}</p>
              <p>Total movements recorded: {movements.length}</p>
            </div>
          )}

          {shopTab === 'team' && (
            <div className="card"><h2>{t(lang, 'team')}</h2>
              {user.role === 'owner' && (
                <div className="form-row">
                  <div><label>Username</label><input value={form.teamUser || ''} onChange={(e) => set('teamUser', e.target.value)} /></div>
                  <div><label>Email</label><input value={form.teamEmail || ''} onChange={(e) => set('teamEmail', e.target.value)} /></div>
                  <div><label>Password</label><input type="password" value={form.teamPass || ''} onChange={(e) => set('teamPass', e.target.value)} /></div>
                  <div><label>Role</label><select value={form.teamRole || 'cashier'} onChange={(e) => set('teamRole', e.target.value)}><option value="manager">Manager</option><option value="cashier">Cashier</option><option value="viewer">View-only</option></select></div>
                </div>
              )}
              {user.role === 'owner' && <button style={{ marginTop: 12 }} onClick={async () => { try { await api('/api/shop/team', 'POST', { username: form.teamUser, email: form.teamEmail, password: form.teamPass, role: form.teamRole || 'cashier' }); await refreshShop(); } catch (e: any) { setErr(e.message); } }}>Add employee</button>}
              <table style={{ marginTop: 20 }}><thead><tr><th>Username</th><th>Email</th><th>Role</th></tr></thead>
                <tbody>{team.map((u: any) => <tr key={u.id}><td>{u.username}</td><td>{u.email || '-'}</td><td>{u.role}</td></tr>)}</tbody></table>
              <p>Cashiers can record sales but cannot create products. View-only users can only view. Role checks are enforced on the server.</p>
            </div>
          )}

          {shopTab === 'billing' && (
            <div className="card"><h2>{t(lang, 'billing')}</h2>
              <h3>Payment methods</h3>
              {shopMethods.length === 0 && <p>No payment methods added by admin yet.</p>}
              <ul>{shopMethods.map((m: any) => <li key={m.id}><b>{m.label}</b> ({m.type}) — {m.account_number || ''} {m.bank_name || ''} {m.branch || ''} — {m.instructions || ''}</li>)}</ul>
              <div className="form-row">
                <div><label>Plan</label><select value={form.payPlan || 'basic'} onChange={(e) => set('payPlan', e.target.value)}><option value="trial">Trial free</option><option value="basic">Basic ৳499</option><option value="standard">Standard ৳999</option><option value="premium">Premium ৳1,999</option></select></div>
                <div><label>Payment method</label><select value={form.payMethod || ''} onChange={(e) => set('payMethod', e.target.value)}><option value="">Select</option>{shopMethods.map((m: any) => <option key={m.id} value={m.id}>{m.label}</option>)}</select></div>
                <div><label>Sender number</label><input value={form.paySender || ''} onChange={(e) => set('paySender', e.target.value)} /></div>
                <div><label>TrxID</label><input value={form.payTrx || ''} onChange={(e) => set('payTrx', e.target.value)} /></div>
              </div>
              <button style={{ marginTop: 12 }} onClick={async () => { try { await api('/api/shop/payments', 'POST', { plan: form.payPlan || 'basic', method_id: form.payMethod, sender_number: form.paySender, trxid: form.payTrx }); await refreshShop(); } catch (e: any) { setErr(e.message); } }}>Submit payment</button>
              <h3 style={{ marginTop: 24 }}>My payments</h3>
              <table><thead><tr><th>Plan</th><th>Amount</th><th>Sender</th><th>TrxID</th><th>Status</th></tr></thead>
                <tbody>{shopPayments.map((p: any) => <tr key={p.id}><td>{p.plan}</td><td>৳{p.amount}</td><td>{p.sender_number}</td><td>{p.trxid}</td><td>{p.status}</td></tr>)}</tbody></table>
            </div>
          )}
          {shopTab === 'password' && <PasswordForm />}
        </main>
      </div>
    </div>
  );
}

function PasswordForm() {
  const [f, setF] = useState<any>({});
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  return (
    <div className="card"><h2>Change Password</h2>
      <label>Current password</label><input type="password" value={f.current || ''} onChange={(e) => setF({ ...f, current: e.target.value })} />
      <label>New password</label><input type="password" value={f.next || ''} onChange={(e) => setF({ ...f, next: e.target.value })} />
      {err && <p className="error">{err}</p>}{msg && <p>{msg}</p>}
      <button style={{ marginTop: 12 }} onClick={async () => { try { await api('/api/auth/change-password', 'POST', { currentPassword: f.current, newPassword: f.next }); setMsg('Password changed'); } catch (e: any) { setErr(e.message); } }}>Change password</button>
    </div>
  );
}

function Recovery({ lang, onBack }: { lang: Lang; onBack: () => void }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [np, setNp] = useState('');
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  return (
    <div>
      <h1>{t(lang, 'recovery')}</h1>
      <p>{lang === 'bn' ? 'আপনার অ্যাকাউন্টের ইমেইল দিন — শুধুমাত্র সেই ইমেইলের সাথে মিললেই কোড তৈরি হবে। কোড কখনো স্ক্রিনে দেখানো হবে না।' : 'Enter the email of your account — a code is generated only if it matches the registered email. The code is never shown on screen.'}</p>
      <label>{t(lang, 'email')}</label>
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      <button style={{ marginTop: 12, width: '100%' }} onClick={async () => { try { const r = await api('/api/auth/recovery/request', 'POST', { email }); setResult(r); setErr(''); } catch (e: any) { setErr(e.message); } }}>{t(lang, 'getCode')}</button>
      {result && result.found && (
        <div className="alert" style={{ marginTop: 16 }}>
          {lang === 'bn' ? `আপনার ${result.maskedEmail} ইমেইলে একটি ৬ সংখ্যার রিকভারি কোড পাঠানো হয়েছে। অনুগ্রহ করে আপনার ইমেইল ইনবক্স চেক করুন।` : `A 6-digit recovery code has been sent to your ${result.maskedEmail} email. Please check your email inbox.`}
        </div>
      )}
      {result && !result.found && <p className="error">{lang === 'bn' ? 'এই ইমেইল দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি।' : 'No account found for this email.'}</p>}
      {result?.found && (
        <div>
          <label>{t(lang, 'recoveryCode')}</label><input value={code} onChange={(e) => setCode(e.target.value)} />
          <label>{t(lang, 'newPassword')}</label><input type="password" value={np} onChange={(e) => setNp(e.target.value)} />
          <button style={{ marginTop: 12, width: '100%' }} onClick={async () => { try { await api('/api/auth/recovery/reset', 'POST', { email, code, newPassword: np }); setDone(true); } catch (e: any) { setErr(e.message); } }}>{t(lang, 'setNewPassword')}</button>
        </div>
      )}
      {done && <p>Password reset. Please sign in with the new password.</p>}
      {err && <p className="error">{err}</p>}
      <p><button className="secondary" style={{ width: '100%' }} onClick={onBack}>{t(lang, 'backToSignIn')}</button></p>
    </div>
  );
}
