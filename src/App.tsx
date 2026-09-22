import { useEffect, useMemo, useState } from 'react';
import {
  Search, ShoppingCart, X, Plus, Trash2, Star, MessageCircle, Copy, Check,
  LayoutDashboard, Package, ShoppingBag, Settings as SettingsIcon, LogOut, Edit3, Eye,
  ChevronRight, ChevronLeft, ChevronDown, User as UserIcon, Users, Tag, Bell, Box, Globe, Store,
  Download, Headphones, BadgeCheck, ShieldCheck, Zap, History, LogIn, AlertCircle,
  ArrowRight, ArrowLeft, LayoutGrid, MapPin, Phone, Facebook, Youtube, Instagram, Send,
} from 'lucide-react';
import { STR, type Lang } from './i18n';
import {
  load, save, tk, slugify, uid, nowStr, eff, offPct, waLink, IMG, fileToResizedDataUrl,
  SEED_SETTINGS, SEED_CATS, SEED_PRODUCTS, SEED_USERS, SEED_ORDERS, SEED_PURCHASES,
  type User, type Category, type Product, type Order, type Purchase, type Payment, type Settings, type CartLine, type View,
} from './store';

const BROWN = '#5a2e0d';
const BROWN_D = '#3d1e07';

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center font-black text-white text-xl font-display relative overflow-hidden shrink-0">
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full"><path d="M18 72 L38 28 L50 52 L62 28 L82 72" stroke="white" strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round" /><circle cx="78" cy="26" r="8" fill="#fb923c" /></svg>
      </div>
      <div className="leading-tight min-w-0">
        <div className="font-display font-extrabold text-base md:text-xl text-white tracking-tight truncate">Murad Graphics</div>
        <div className="text-[8px] md:text-[10px] tracking-[.25em] text-orange-200/70 font-semibold">DIGITAL STORE</div>
      </div>
    </div>
  );
}

const payBadge = (s: string) => s === 'Paid' ? 'bg-emerald-100 text-emerald-700' : s === 'Failed' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700';

export default function App() {
  const [lang, setLang] = useState<Lang>(() => load('ks_lang', 'bn' as Lang));
  const [users, setUsers] = useState<User[]>(() => load('ks_users_v2', SEED_USERS));
  const [categories, setCategories] = useState<Category[]>(() => load('ks_cats_v2', SEED_CATS));
  const [products, setProducts] = useState<Product[]>(() => load('ks_products_v2', SEED_PRODUCTS));
  const [orders, setOrders] = useState<Order[]>(() => load('ks_orders_v2', SEED_ORDERS));
  const [purchases, setPurchases] = useState<Purchase[]>(() => load('ks_purchases_v2', SEED_PURCHASES));
  const [payments, setPayments] = useState<Payment[]>(() => load('ks_payments_v2', [] as Payment[]));
  const [settings, setSettings] = useState<Settings>(() => load('ks_settings_v2', SEED_SETTINGS));
  const [cart, setCart] = useState<CartLine[]>(() => load('ks_cart_v1', [] as CartLine[]));
  const [sessionId, setSessionId] = useState<string | null>(() => sessionStorage.getItem('ks_session_v1'));

  const [view, setView] = useState<View>('home');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('popular');
  const [slide, setSlide] = useState(0);
  const [gal, setGal] = useState(0);
  const [tab, setTab] = useState<'desc' | 'rev'>('desc');
  const [authOpen, setAuthOpen] = useState<'login' | 'register' | null>(null);
  const [authForm, setAuthForm] = useState({ name: '', email: '', pass: '' });
  const [authErr, setAuthErr] = useState('');
  const [toast, setToast] = useState('');
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState('');
  const [acctMenu, setAcctMenu] = useState(false);
  const [payMethod, setPayMethod] = useState('bKash');
  const [trxId, setTrxId] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [orderPlaced, setOrderPlaced] = useState<Order | null>(null);
  const [revName, setRevName] = useState('');
  const [revText, setRevText] = useState('');
  const [revStars, setRevStars] = useState(5);
  const [adminTab, setAdminTab] = useState<'overview' | 'products' | 'orders' | 'customers' | 'cats' | 'settings'>('overview');
  const [pendingBuy, setPendingBuy] = useState<string | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imgUrl, setImgUrl] = useState('');

  const t = STR[lang];

  useEffect(() => save('ks_lang', lang), [lang]);
  useEffect(() => save('ks_users_v2', users), [users]);
  useEffect(() => save('ks_cats_v2', categories), [categories]);
  useEffect(() => save('ks_products_v2', products), [products]);
  useEffect(() => save('ks_orders_v2', orders), [orders]);
  useEffect(() => save('ks_purchases_v2', purchases), [purchases]);
  useEffect(() => save('ks_payments_v2', payments), [payments]);
  useEffect(() => save('ks_settings_v2', settings), [settings]);
  useEffect(() => save('ks_cart_v1', cart), [cart]);
  useEffect(() => { window.scrollTo(0, 0); }, [view, detailId]);
  useEffect(() => {
    const els = document.querySelectorAll('.reveal:not(.reveal-vis)');
    const ob = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('reveal-vis'); ob.unobserve(e.target); } }), { threshold: 0.08 });
    els.forEach(el => ob.observe(el));
    return () => ob.disconnect();
  }, [view, products, detailId]);
  useEffect(() => { if (!toast && !err) return; const id = setTimeout(() => { setToast(''); setErr(''); }, 2600); return () => clearTimeout(id); }, [toast, err]);
  useEffect(() => { setGal(0); setTab('desc'); }, [detailId]);
  useEffect(() => {
    setCart(c => {
      const pruned = c.filter(l => products.some(p => p.id === l.productId && p.status === 'active'));
      return pruned.length === c.length ? c : pruned;
    });
  }, [products]);

  const slides = useMemo(() => products.filter(p => p.status === 'active').slice(0, 5), [products]);
  useEffect(() => {
    if (view !== 'home' || slides.length < 2) return;
    const id = setInterval(() => setSlide(s => (s + 1) % slides.length), 5000);
    return () => clearInterval(id);
  }, [view, slides.length]);
  useEffect(() => { setSlide(s => (slides.length ? s % slides.length : 0)); }, [slides.length]);

  const me = users.find(u => u.id === sessionId) || null;
  const activeCats = categories.filter(c => c.status === 'active');
  const activeProducts = products.filter(p => p.status === 'active');
  const catName = (id: string) => categories.find(c => c.id === id)?.name || '—';
  const detail = products.find(p => p.id === detailId) || null;
  useEffect(() => { if (view === 'details' && !detail) setView('products'); }, [view, detail]);

  // access rule: logged in + owns (paid purchase)
  const owns = (uid_: string | null, pid: string) => !!uid_ && purchases.some(p => p.userId === uid_ && p.productId === pid && p.accessStatus === 'active');
  const myPurchases = purchases.filter(p => p.userId === sessionId && p.accessStatus === 'active');
  const myOrders = orders.filter(o => o.userId === sessionId);

  const filtered = useMemo(() => {
    let list = activeProducts.filter(p =>
      (catFilter === 'All' || p.categoryId === catFilter) &&
      (p.name + p.description).toLowerCase().includes(search.toLowerCase()) &&
      (!maxPrice || eff(p) <= +maxPrice));
    if (sort === 'low') list = [...list].sort((a, b) => eff(a) - eff(b));
    else if (sort === 'high') list = [...list].sort((a, b) => eff(b) - eff(a));
    else if (sort === 'new') list = [...list].reverse();
    else list = [...list].sort((a, b) => b.sold - a.sold);
    return list;
  }, [activeProducts, catFilter, search, maxPrice, sort]);

  const cartDetailed = cart.map(c => ({ ...c, p: products.find(p => p.id === c.productId && p.status === 'active')! })).filter(x => x.p);
  const subtotal = cartDetailed.reduce((s, x) => s + eff(x.p), 0);
  const couponValue = (code: string) => {
    const k = Object.keys(settings.coupons).find(k => k.toUpperCase() === code.trim().toUpperCase());
    return k ? settings.coupons[k] : undefined;
  };
  const couponVal = appliedCoupon ? couponValue(appliedCoupon) : undefined;
  let couponDisc = 0;
  if (couponVal) { if (couponVal.endsWith('%')) couponDisc = Math.round(subtotal * parseFloat(couponVal) / 100); else couponDisc = parseInt(couponVal) || 0; }
  const total = Math.max(0, subtotal - couponDisc); // delivery 0 — digital
  const revenue = orders.filter(o => o.paymentStatus === 'Paid').reduce((s, o) => s + o.total, 0);

  const notify = (m: string) => setToast(m);
  const fail = (m: string) => setErr(m);
  const copy = (txt: string, label: string) => { try { navigator.clipboard?.writeText(txt); } catch { /* na */ } setCopied(label); setTimeout(() => setCopied(''), 1500); };
  const goDetails = (id: string) => { setDetailId(id); setView('details'); };

  // ---------- auth ----------
  const doRegister = () => {
    setAuthErr('');
    try {
      if (!authForm.name.trim() || !authForm.email.trim() || !authForm.pass) throw new Error(lang === 'bn' ? 'নাম, ইমেইল ও পাসওয়ার্ড দিন।' : 'Name, email and password required.');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(authForm.email)) throw new Error(lang === 'bn' ? 'সঠিক ইমেইল দিন।' : 'Enter a valid email.');
      if (users.some(u => u.email.toLowerCase() === authForm.email.toLowerCase())) throw new Error(lang === 'bn' ? 'এই ইমেইলে account আছে — Login করুন।' : 'Account exists — please login.');
      const u: User = { id: uid('u'), name: authForm.name.trim(), email: authForm.email.trim(), pass: authForm.pass, role: 'customer', createdAt: nowStr() };
      setUsers([...users, u]);
      sessionStorage.setItem('ks_session_v1', u.id); setSessionId(u.id);
      setAuthOpen(null); notify('✓ ' + u.name); consumePendingBuy(u.id);
    } catch (e: unknown) { setAuthErr(e instanceof Error ? e.message : 'Failed'); }
  };
  const doLogin = () => {
    setAuthErr('');
    const u = users.find(x => x.email.toLowerCase() === authForm.email.toLowerCase() && x.pass === authForm.pass);
    if (!u) { setAuthErr(lang === 'bn' ? 'ভুল ইমেইল/পাসওয়ার্ড। (demo@demo.com / demo123)' : 'Wrong email/password. (demo@demo.com / demo123)'); return; }
    sessionStorage.setItem('ks_session_v1', u.id); setSessionId(u.id);
    setAuthOpen(null); notify('✓ ' + u.name); consumePendingBuy(u.id);
    if (u.role === 'admin' && !pendingBuy) setView('admin');
  };
  const logout = () => { sessionStorage.removeItem('ks_session_v1'); setSessionId(null); setAcctMenu(false); setView('home'); };

  // ---------- cart (digital: one per product, no qty) ----------
  const addCart = (pid: string) => {
    if (owns(sessionId, pid)) { fail(t.alreadyPurchased); setView('purchases'); return; }
    if (cart.some(c => c.productId === pid)) { fail(t.alreadyCart); return; }
    setCart([...cart, { productId: pid }]); notify('✓ ' + t.cartAdded);
  };
  const buyNow = (pid: string) => {
    if (owns(sessionId, pid)) { fail(t.alreadyPurchased); setView('purchases'); return; }
    if (!me) { setPendingBuy(pid); setAuthOpen('login'); fail(t.loginRequired); return; }
    setCart([{ productId: pid }]); setView('checkout');
  };
  const consumePendingBuy = (uid_: string) => {
    if (pendingBuy) {
      const pid = pendingBuy; setPendingBuy(null);
      if (!owns(uid_, pid)) { setCart([{ productId: pid }]); setView('checkout'); return; }
      setView('purchases'); return;
    }
  };

  // ---------- checkout → Pending → admin verify → purchase ----------
  const placeOrder = () => {
    try {
      if (!me) throw new Error(t.loginRequired);
      if (cartDetailed.length === 0) throw new Error(t.cartEmpty);
      if (!trxId.trim()) throw new Error(t.trxRequired);
      if (appliedCoupon && !couponValue(appliedCoupon)) throw new Error(t.invalidCoupon);
      const trxLow = trxId.trim().toLowerCase();
      if (payments.some(p => p.transactionId.toLowerCase() === trxLow) || orders.some(o => (o.trxId || '').toLowerCase() === trxLow)) throw new Error(t.trxUsed);
      const oid = 'MG-' + Date.now().toString(36).toUpperCase().slice(-4) + Math.floor(1000 + Math.random() * 9000);
      const order: Order = {
        id: oid, userId: me.id,
        items: cartDetailed.map(x => ({ productId: x.p.id, name: x.p.name, price: eff(x.p) })),
        subtotal, discount: couponDisc, total, coupon: appliedCoupon,
        paymentMethod: payMethod, paymentStatus: 'Pending', orderStatus: 'Awaiting Verification', trxId: trxId.trim(), createdAt: nowStr(),
      };
      setOrders([order, ...orders]);
      setPayments([{ id: uid('pay'), orderId: oid, userId: me.id, amount: total, transactionId: trxId.trim(), method: payMethod, status: 'Pending', createdAt: nowStr() }, ...payments]);
      setOrderPlaced(order); setCart([]); setAppliedCoupon(''); setCouponInput(''); setTrxId('');
    } catch (e: unknown) { fail(e instanceof Error ? e.message : 'Failed'); }
  };

  const verifyPayment = (orderId: string, ok: boolean) => {
    const o = orders.find(x => x.id === orderId); if (!o) return;
    const st = ok ? 'Paid' : 'Failed';
    setOrders(orders.map(x => x.id === orderId ? { ...x, paymentStatus: st as Order['paymentStatus'], orderStatus: (ok ? 'Completed' : 'Payment Failed') as Order['orderStatus'] } : x));
    setPayments(payments.map(p => p.orderId === orderId ? { ...p, status: st as Payment['status'] } : p));
    if (ok) {
      const fresh: Purchase[] = [];
      o.items.forEach(it => {
        if (!purchases.some(p => p.userId === o.userId && p.productId === it.productId && p.accessStatus === 'active'))
          fresh.push({ id: uid('pu'), userId: o.userId, productId: it.productId, orderId, accessStatus: 'active', purchasedAt: nowStr() });
      });
      setPurchases([...fresh, ...purchases]);
      setProducts(products.map(p => o.items.some(i => i.productId === p.id) ? { ...p, sold: p.sold + 1 } : p));
      notify('✓ ' + t.saved);
    } else fail(t.failed);
  };

  const openAccess = (uid_: string | null, pid: string) => {
    const prod = products.find(p => p.id === pid);
    if (!uid_) { fail(t.pleaseLogin); return; }
    if (!owns(uid_, pid)) { fail(t.accessDenied); return; }
    if (!prod?.googleDriveLink) { fail(t.noAccessLink); return; }
    window.open(prod.googleDriveLink, '_blank');
  };

  const addReview = () => {
    if (!me) { fail(t.pleaseLogin); return; }
    if (!revName.trim() || !revText.trim() || !detail) { fail(t.fillReview); return; }
    setProducts(products.map(p => p.id === detail.id ? { ...p, reviews: [...p.reviews, { name: revName.trim(), rating: revStars, text: revText.trim(), date: nowStr() }] } : p));
    setRevName(''); setRevText(''); setRevStars(5); notify('✓ ' + t.reviewAdded);
  };

  const handleFiles = async (files: FileList | null, isCat: boolean) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const f of Array.from(files).slice(0, 5)) {
        const d = await fileToResizedDataUrl(f);
        if (isCat) setEditingCat(prev => (prev ? { ...prev, image: d } : prev));
        else setEditing(prev => {
          if (!prev) return prev;
          const cur = prev.previewImages.filter(Boolean);
          if (cur.length >= 5) return prev;
          return { ...prev, previewImages: [...cur, d] };
        });
      }
      notify('✓ ' + t.saved);
    } catch (e: unknown) { fail(e instanceof Error ? e.message : 'Upload failed'); }
    setUploading(false);
  };

  const payNumbers: [string, string, string][] = [['bKash', settings.bkash, '#e2136e'], ['Nagad', settings.nagad, '#f6921e'], ['Rocket', settings.rocket, '#8c3494'], ['Binance', settings.binance, '#111827']];

  // ---------- kholos-style card ----------
  const ProductCard = ({ p }: { p: Product }) => {
    const owned = owns(sessionId, p.id);
    return (
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden card-hover flex flex-col">
        <div className="relative cursor-pointer img-zoom group" onClick={() => goDetails(p.id)}>
          <img src={p.previewImages[0] || IMG(p.id)} alt={p.name} loading="lazy" className="w-full h-52 md:h-64 object-cover" onError={e => { const im = e.target as HTMLImageElement; im.onerror = null; im.src = IMG(p.id); }} />
          {offPct(p) > 0 && <span className="absolute bottom-2 left-2 text-white text-[11px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow" style={{ background: BROWN }}><Zap size={11} className="fill-orange-400 text-orange-400" />{offPct(p)}% {t.off}</span>}
          {owned
            ? <span className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-black px-2 py-1 rounded-full flex items-center gap-1 shadow"><Check size={11} />{t.ownedBadge}</span>
            : <span className="absolute top-2 left-2 text-white text-[10px] font-black px-2 py-1 rounded-full shadow" style={{ background: BROWN }}>{t.digitalTag}</span>}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex items-end justify-center gap-2 pb-4">
            {owned
              ? <button onClick={e => { e.stopPropagation(); openAccess(sessionId, p.id); }} className="bg-emerald-500 text-white text-xs font-black px-5 py-2.5 rounded-full flex items-center gap-1.5 shadow-xl"><Download size={14} />{t.download}</button>
              : <><button onClick={e => { e.stopPropagation(); goDetails(p.id); }} className="bg-white text-slate-800 text-xs font-black px-5 py-2.5 rounded-full shadow-xl hover:bg-orange-50">{t.buyNow}</button>
                <button onClick={e => { e.stopPropagation(); addCart(p.id); }} className="bg-white/20 backdrop-blur border border-white/40 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/30" title={t.addToCart}><ShoppingCart size={16} /></button></>}
          </div>
        </div>
        <div className="p-3 flex flex-col flex-1">
          <h3 className="text-[13px] md:text-sm text-slate-800 leading-snug line-clamp-2 min-h-[2.6em] cursor-pointer hover:text-[#7c2d12]" onClick={() => goDetails(p.id)}>{p.name}</h3>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400"><Star size={12} className="fill-amber-400 text-amber-400" />{p.rating} <span>({p.sold.toLocaleString()})</span></div>
          <div className="border-t border-slate-100 mt-2 pt-2 flex items-end justify-between gap-2">
            <div>
              <div className="font-display font-black text-xl md:text-2xl" style={{ color: BROWN }}>{tk(eff(p))}</div>
              <div className="flex items-center gap-2">
                {offPct(p) > 0 && <s className="text-xs text-slate-400">{tk(p.price)}</s>}
                {offPct(p) > 0 && <span className="text-[11px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-md">-{offPct(p)}%</span>}
              </div>
            </div>
            {owned
              ? <button onClick={() => openAccess(sessionId, p.id)} className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition shrink-0" title={t.download}><Download size={17} /></button>
              : <button onClick={() => addCart(p.id)} className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:border-[#5a2e0d] hover:text-[#5a2e0d] hover:bg-orange-50 transition shrink-0" title={t.addToCart}><ShoppingCart size={17} /></button>}
          </div>
        </div>
      </div>
    );
  };

  // ================= ADMIN =================
  if (view === 'admin') {
    if (!me || me.role !== 'admin') return (
      <div className="min-h-screen bg-[#f6f3ee] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow">
          <AlertCircle size={40} className="mx-auto text-rose-500" />
          <h2 className="font-black text-xl mt-2">Access Denied</h2>
          <p className="text-sm text-slate-500 mt-1">admin@muradgraphics.store / murad123</p>
          <div className="grid gap-2 mt-4">
            <button onClick={() => { setView('home'); setAuthOpen('login'); }} className="text-white font-bold py-3 rounded-2xl text-sm" style={{ background: BROWN }}>Admin Login</button>
            <button onClick={() => setView('home')} className="bg-slate-100 font-bold py-3 rounded-2xl text-sm">{t.home}</button>
          </div>
        </div>
      </div>
    );
    const pendPay = payments.filter(p => p.status === 'Pending');
    return (
      <div className="min-h-screen bg-slate-100">
        <header className="text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-20" style={{ background: BROWN_D }}>
          <Logo />
          <div className="flex-1 min-w-0"><div className="font-bold truncate">Admin Dashboard</div><div className="text-xs text-orange-200/70 truncate hidden sm:block">{me.name}</div></div>
          <button onClick={() => setView('home')} className="shrink-0 text-xs bg-white/10 px-3 py-2 rounded-lg flex items-center gap-1"><Eye size={14} /> Store</button>
          <button onClick={logout} className="shrink-0 text-xs bg-rose-500 px-3 py-2 rounded-lg flex items-center gap-1"><LogOut size={14} /> {t.logout}</button>
        </header>
        <div className="max-w-6xl mx-auto p-4">
          <div className="flex gap-2 flex-wrap mb-4">
            {([['overview', 'Overview', LayoutDashboard], ['products', 'Products', Package], ['orders', 'Orders', ShoppingBag], ['customers', 'Customers', Users], ['cats', 'Categories', Tag], ['settings', 'Settings', SettingsIcon]] as [typeof adminTab, string, typeof LayoutDashboard][]).map(([k, l, Icon]) => (
              <button key={k} onClick={() => setAdminTab(k)} className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 ${adminTab === k ? 'text-white shadow' : 'bg-white text-slate-600'}`} style={adminTab === k ? { background: BROWN } : {}}><Icon size={15} />{l}{k === 'orders' && pendPay.length > 0 && <span className="bg-rose-500 text-white text-[10px] px-1.5 rounded-full">{pendPay.length}</span>}</button>
            ))}
          </div>

          {adminTab === 'overview' && (
            <div className="grid gap-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[[lang === 'bn' ? 'মোট Revenue (Paid)' : 'Revenue (Paid)', tk(revenue)], ['Orders', String(orders.length)], ['Products', String(products.length)], ['Customers', String(users.filter(u => u.role === 'customer').length)]].map(([l, v]) => (
                  <div key={l as string} className="text-white rounded-2xl p-4" style={{ background: `linear-gradient(135deg, ${BROWN}, #8a4a12)` }}><div className="text-xs opacity-80">{l as string}</div><div className="text-2xl font-extrabold font-display">{v as string}</div></div>
                ))}
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h3 className="font-bold mb-2">⏳ Pending Verification ({pendPay.length})</h3>
                {pendPay.length === 0 ? <p className="text-sm text-slate-500">—</p> : pendPay.map(p => (
                  <div key={p.id} className="border rounded-xl p-3 mb-2 text-sm flex flex-wrap items-center gap-2">
                    <div className="flex-1 min-w-[200px]"><span className="font-mono font-bold">{p.orderId}</span><span className="text-slate-500"> • {users.find(u => u.id === p.userId)?.name} • {p.method} • Trx: <b className="font-mono">{p.transactionId}</b> • <b>{tk(p.amount)}</b></span></div>
                    <button onClick={() => verifyPayment(p.orderId, true)} className="bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-lg">✓ Verify & Grant</button>
                    <button onClick={() => verifyPayment(p.orderId, false)} className="bg-rose-50 text-rose-600 text-xs font-bold px-3 py-2 rounded-lg">Reject</button>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h3 className="font-bold mb-2">Recent Orders</h3>
                <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-slate-500 text-xs"><th className="p-2">Order</th><th className="p-2">Customer</th><th className="p-2">Total</th><th className="p-2">Payment</th></tr></thead><tbody>
                  {orders.slice(0, 6).map(o => <tr key={o.id} className="border-t"><td className="p-2 font-mono font-bold">{o.id}</td><td className="p-2">{users.find(u => u.id === o.userId)?.name}</td><td className="p-2 font-bold">{tk(o.total)}</td><td className="p-2"><span className={`text-xs px-2 py-1 rounded-full font-bold ${payBadge(o.paymentStatus)}`}>{o.paymentStatus}</span></td></tr>)}
                </tbody></table></div>
              </div>
            </div>
          )}

          {adminTab === 'products' && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h3 className="font-bold">Products ({products.length})</h3>
                <button onClick={() => { setImgUrl(''); setEditing({ id: uid('p'), name: '', slug: '', description: '', price: 500, categoryId: categories[0]?.id || '', previewImages: [], googleDriveLink: '', features: [], reviews: [], status: 'active', rating: 4.8, sold: 0, createdAt: nowStr() }); }} className="text-white text-sm px-4 py-2 rounded-xl flex items-center gap-1" style={{ background: BROWN }}><Plus size={15} /> New</button>
              </div>
              <div className="grid gap-2">
                {products.map(p => (
                  <div key={p.id} className="flex items-center gap-3 border rounded-xl p-2">
                    <img src={p.previewImages[0] || IMG(p.id, 200)} alt="" className="w-14 h-14 rounded-lg object-cover bg-slate-200" onError={e => { const im = e.target as HTMLImageElement; im.onerror = null; im.src = IMG(p.id, 200); }} />
                    <div className="flex-1 min-w-0"><div className="font-semibold text-sm truncate">{p.name}</div><div className="text-xs text-slate-500">{catName(p.categoryId)} • {tk(eff(p))} • {p.status} • {p.sold} sold</div></div>
                    <button onClick={() => { setImgUrl(''); setEditing({ ...p }); }} className="p-2 bg-slate-100 rounded-lg"><Edit3 size={15} /></button>
                    <button onClick={() => { if (confirm('Delete?')) setProducts(products.filter(x => x.id !== p.id)); }} className="p-2 bg-rose-50 text-rose-600 rounded-lg"><Trash2 size={15} /></button>
                  </div>
                ))}
              </div>
              {editing && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
                  <div className="bg-white rounded-2xl p-5 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                    <h3 className="font-bold mb-3">Product (Drive link আবশ্যক)</h3>
                    <div className="grid gap-2 text-sm">
                      <input className="border rounded-lg px-3 py-2" placeholder="Name" value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value, slug: slugify(e.target.value) + '-' + editing.id })} />
                      <div className="grid grid-cols-2 gap-2">
                        <input type="number" className="border rounded-lg px-3 py-2" placeholder="Price ৳" value={editing.price} onChange={e => setEditing({ ...editing, price: +e.target.value })} />
                        <input type="number" className="border rounded-lg px-3 py-2" placeholder="Discount ৳" value={editing.discountPrice || ''} onChange={e => setEditing({ ...editing, discountPrice: e.target.value ? +e.target.value : undefined })} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <select className="border rounded-lg px-3 py-2" value={editing.categoryId} onChange={e => setEditing({ ...editing, categoryId: e.target.value })}>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                        <select className="border rounded-lg px-3 py-2" value={editing.status} onChange={e => setEditing({ ...editing, status: e.target.value as Product['status'] })}><option value="active">active (show)</option><option value="hidden">hidden</option></select>
                      </div>
                      <input className="border rounded-lg px-3 py-2 font-mono" placeholder="Google Drive / download link *" value={editing.googleDriveLink} onChange={e => setEditing({ ...editing, googleDriveLink: e.target.value })} />
                      <div className="border rounded-xl p-2.5 bg-slate-50">
                        <div className="font-bold text-xs mb-1.5">🖼️ Preview Images ({editing.previewImages.filter(Boolean).length}/5)</div>
                        <div className="flex gap-1.5 flex-wrap mb-2">
                          {editing.previewImages.map((src, i) => src ? (
                            <div key={i} className="relative"><img src={src} alt="" className="w-16 h-16 rounded-lg object-cover border" />
                              <button onClick={() => setEditing({ ...editing, previewImages: editing.previewImages.filter((_, j) => j !== i) })} className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5"><X size={11} /></button></div>
                          ) : null)}
                        </div>
                        <label className="block text-center text-xs font-bold px-3 py-2.5 rounded-lg cursor-pointer text-white" style={{ background: BROWN }}>{uploading ? '⏳…' : '📤 Device থেকে Upload'}
                          <input type="file" accept="image/*" multiple className="hidden" disabled={uploading} onChange={e => { handleFiles(e.target.files, false); e.target.value = ''; }} /></label>
                        <div className="flex gap-1.5 mt-1.5">
                          <input className="flex-1 border rounded-lg px-2.5 py-2 text-xs bg-white" placeholder="…or image URL" value={imgUrl} onChange={e => setImgUrl(e.target.value)} />
                          <button onClick={() => { if (!imgUrl.trim()) return; setEditing({ ...editing, previewImages: [...editing.previewImages.filter(Boolean), imgUrl.trim()] }); setImgUrl(''); }} className="text-xs bg-slate-900 text-white px-3 rounded-lg font-bold">Add</button>
                        </div>
                      </div>
                      <textarea className="border rounded-lg px-3 py-2" rows={2} placeholder="Description" value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })} />
                      <textarea className="border rounded-lg px-3 py-2" rows={2} placeholder="Features (line per item)" value={editing.features.join('\n')} onChange={e => setEditing({ ...editing, features: e.target.value.split('\n').filter(Boolean) })} />
                      <div className="flex gap-2"><button onClick={() => {
                        if (!editing.name.trim()) { fail('Name required'); return; }
                        if (!editing.googleDriveLink.trim()) { fail('Google Drive link আবশ্যক'); return; }
                        setProducts(products.find(x => x.id === editing.id) ? products.map(x => x.id === editing.id ? editing : x) : [...products, editing]);
                        setEditing(null); notify('✓ ' + t.saved);
                      }} className="flex-1 text-white py-2.5 rounded-xl font-bold" style={{ background: BROWN }}>Save</button><button onClick={() => setEditing(null)} className="px-4 bg-slate-100 rounded-xl">Cancel</button></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {adminTab === 'orders' && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold mb-3">Orders ({orders.length}) • {tk(revenue)} (Paid)</h3>
              {orders.length === 0 ? <p className="text-sm text-slate-500">—</p> : orders.map(o => (
                <div key={o.id} className="border rounded-xl p-3 mb-2 text-sm">
                  <div className="flex items-center justify-between flex-wrap gap-2"><span className="font-mono font-bold">{o.id}</span><span className={`text-xs px-2 py-1 rounded-full font-bold ${payBadge(o.paymentStatus)}`}>{o.paymentStatus}</span></div>
                  <div className="text-slate-600 mt-1">{users.find(u => u.id === o.userId)?.name} • {o.paymentMethod} • Trx: <b className="font-mono">{o.trxId || '—'}</b></div>
                  <div className="text-xs text-slate-500 mt-1">{o.items.map(i => i.name).join(', ')}</div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap"><span className="font-bold">{tk(o.total)}</span><span className="text-xs text-slate-400">{o.createdAt}</span>
                    {o.paymentStatus === 'Pending' && <><button onClick={() => verifyPayment(o.id, true)} className="text-xs bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-bold">✓ Verify & Grant</button><button onClick={() => verifyPayment(o.id, false)} className="text-xs bg-rose-50 text-rose-600 px-3 py-1.5 rounded-lg font-bold">Reject</button></>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {adminTab === 'customers' && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold mb-3">Customers ({users.filter(u => u.role === 'customer').length})</h3>
              {users.filter(u => u.role === 'customer').map(u => {
                const uo = orders.filter(o => o.userId === u.id);
                const up = purchases.filter(p => p.userId === u.id && p.accessStatus === 'active');
                return <div key={u.id} className="border rounded-xl p-3 mb-2 text-sm">
                  <div className="font-bold flex items-center gap-1.5"><UserIcon size={14} />{u.name} <span className="text-xs font-normal text-slate-500">{u.email}</span></div>
                  <div className="text-xs text-slate-500 mt-1">{u.createdAt} • Orders: {uo.length} • Purchased: {up.length}</div>
                  {up.length > 0 && <div className="text-xs text-emerald-700 mt-1">✓ {up.map(p => products.find(x => x.id === p.productId)?.name).join(', ')}</div>}
                </div>;
              })}
            </div>
          )}

          {adminTab === 'cats' && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3"><h3 className="font-bold">Categories ({categories.length})</h3>
                <button onClick={() => setEditingCat({ id: uid('c'), name: '', slug: '', image: '', status: 'active' })} className="text-white text-sm px-4 py-2 rounded-xl flex items-center gap-1" style={{ background: BROWN }}><Plus size={15} /> New</button></div>
              {categories.map(c => (
                <div key={c.id} className="flex items-center gap-2 border rounded-xl p-2.5 mb-2 text-sm">
                  {c.image ? <img src={c.image} alt="" className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center"><Tag size={16} className="text-[#7c2d12]" /></div>}
                  <div className="flex-1"><b>{c.name}</b> <span className="text-xs text-slate-400">• {products.filter(p => p.categoryId === c.id).length} • {c.status}</span></div>
                  <button onClick={() => setEditingCat({ ...c })} className="p-2 bg-slate-100 rounded-lg"><Edit3 size={14} /></button>
                  <button onClick={() => { if (products.some(p => p.categoryId === c.id)) { fail('Category has products'); return; } if (confirm('Delete?')) setCategories(categories.filter(x => x.id !== c.id)); }} className="p-2 bg-rose-50 text-rose-600 rounded-lg"><Trash2 size={14} /></button>
                </div>
              ))}
              {editingCat && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditingCat(null)}>
                  <div className="bg-white rounded-2xl p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                    <h3 className="font-bold mb-3">Category</h3>
                    <div className="grid gap-2 text-sm">
                      {editingCat.image && <img src={editingCat.image} alt="" className="w-20 h-20 rounded-full object-cover mx-auto" />}
                      <input className="border rounded-lg px-3 py-2" placeholder="Name" value={editingCat.name} onChange={e => setEditingCat({ ...editingCat, name: e.target.value, slug: slugify(e.target.value) })} />
                      <select className="border rounded-lg px-3 py-2" value={editingCat.status} onChange={e => setEditingCat({ ...editingCat, status: e.target.value as Category['status'] })}><option value="active">active</option><option value="hidden">hidden</option></select>
                      <label className="block text-center text-xs font-bold px-3 py-2.5 rounded-lg cursor-pointer text-white" style={{ background: BROWN }}>{uploading ? '⏳…' : '📤 Upload image'}
                        <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={e => { handleFiles(e.target.files, true); e.target.value = ''; }} /></label>
                      <input className="border rounded-lg px-3 py-2" placeholder="…or image URL" value={editingCat.image.startsWith('data:') ? '' : editingCat.image} onChange={e => setEditingCat({ ...editingCat, image: e.target.value })} />
                      <div className="flex gap-2"><button onClick={() => { if (!editingCat.name.trim()) { fail('Name required'); return; } setCategories(categories.find(x => x.id === editingCat.id) ? categories.map(x => x.id === editingCat.id ? editingCat : x) : [...categories, editingCat]); setEditingCat(null); notify('✓ ' + t.saved); }} className="flex-1 text-white py-2.5 rounded-xl font-bold" style={{ background: BROWN }}>Save</button><button onClick={() => setEditingCat(null)} className="px-4 bg-slate-100 rounded-xl">Cancel</button></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {adminTab === 'settings' && (
            <div className="bg-white rounded-2xl p-5 shadow-sm grid gap-4 text-sm max-w-2xl">
              <h3 className="font-bold text-base">⚙️ Settings</h3>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <label className="font-bold text-emerald-800">WhatsApp Number *</label>
                <input className="mt-1 w-full border rounded-lg px-3 py-2 font-mono" value={settings.whatsapp} onChange={e => setSettings({ ...settings, whatsapp: e.target.value })} />
              </div>
              <div className="grid md:grid-cols-2 gap-2">
                <label>Store Name<input className="w-full border rounded-lg px-3 py-2 mt-1" value={settings.storeName} onChange={e => setSettings({ ...settings, storeName: e.target.value })} /></label>
                <label>Topbar text<input className="w-full border rounded-lg px-3 py-2 mt-1" value={settings.announcement} onChange={e => setSettings({ ...settings, announcement: e.target.value })} /></label>
                <label>bKash<input className="w-full border rounded-lg px-3 py-2 mt-1 font-mono" value={settings.bkash} onChange={e => setSettings({ ...settings, bkash: e.target.value })} /></label>
                <label>Nagad<input className="w-full border rounded-lg px-3 py-2 mt-1 font-mono" value={settings.nagad} onChange={e => setSettings({ ...settings, nagad: e.target.value })} /></label>
                <label>Rocket<input className="w-full border rounded-lg px-3 py-2 mt-1 font-mono" value={settings.rocket} onChange={e => setSettings({ ...settings, rocket: e.target.value })} /></label>
                <label>Binance ID<input className="w-full border rounded-lg px-3 py-2 mt-1 font-mono" value={settings.binance} onChange={e => setSettings({ ...settings, binance: e.target.value })} /></label>
                <label>Facebook<input className="w-full border rounded-lg px-3 py-2 mt-1" value={settings.facebook} onChange={e => setSettings({ ...settings, facebook: e.target.value })} /></label>
                <label>YouTube<input className="w-full border rounded-lg px-3 py-2 mt-1" value={settings.youtube} onChange={e => setSettings({ ...settings, youtube: e.target.value })} /></label>
              </div>
              <label>Promo title<input className="w-full border rounded-lg px-3 py-2 mt-1" value={settings.promoTitle} onChange={e => setSettings({ ...settings, promoTitle: e.target.value })} /></label>
              <label>Promo banner image URL<input className="w-full border rounded-lg px-3 py-2 mt-1" value={settings.promoImage.startsWith('data:') ? '' : settings.promoImage} onChange={e => setSettings({ ...settings, promoImage: e.target.value })} /></label>
              <label>Coupons (WELCOME10=10%, TK50=50)<input className="w-full border rounded-lg px-3 py-2 mt-1 font-mono" value={Object.entries(settings.coupons).map(([k, v]) => `${k}=${v}`).join(', ')} onChange={e => { const o: Record<string, string> = {}; e.target.value.split(',').forEach(s => { const [k, v] = s.split('=').map(x => x?.trim()); if (k && v) o[k] = v; }); setSettings({ ...settings, coupons: o }); }} /></label>
              <button onClick={() => notify('✓ ' + t.saved)} className="text-white px-6 py-2.5 rounded-xl font-bold w-fit" style={{ background: BROWN }}>Save</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ================= STORE =================
  const hero = slides[slide] || activeProducts[0];
  const trustItems: [typeof Zap, string][] = [[Zap, t.instantAccess], [BadgeCheck, t.verifiedPay], [Headphones, t.support247], [Download, t.lifetimeLib], [ShieldCheck, t.securePay]];

  return (
    <div className="min-h-screen bg-[#f7f4ef]">
      {/* topbar */}
      <div className="text-white text-xs md:text-sm" style={{ background: BROWN_D }}>
        <div className="max-w-7xl mx-auto px-3 py-2 flex items-center gap-2">
          <span className="font-medium truncate min-w-0">{lang === 'bn' ? settings.announcement.replace('Welcome to Murad Graphics!', 'মুরাদ গ্রাফিক্সে স্বাগতম!') : settings.announcement}</span>
          <div className="flex-1" />
          <button onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')} className="shrink-0 flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg font-bold"><Globe size={14} />{lang === 'bn' ? 'বাংলা' : 'EN'}</button>
          <button onClick={() => { if (!me) { setAuthOpen('login'); fail(t.loginRequired); return; } setView('orders'); }} className="hover:text-orange-200 font-semibold hidden sm:block">{t.myOrders}</button>
          <a href={waLink(settings.whatsapp, 'Support needed')} target="_blank" rel="noreferrer" className="hover:text-orange-200 font-semibold">{t.support}</a>
        </div>
      </div>

      {/* header */}
      <header className="text-white sticky top-0 z-30 shadow-lg" style={{ background: BROWN }}>
        <div className="max-w-7xl mx-auto px-3 py-3 flex items-center gap-3">
          <button onClick={() => setView('home')} className="shrink-0"><Logo /></button>
          <div className="flex-1 max-w-2xl mx-auto relative hidden sm:block">
            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && setView('products')} placeholder={t.searchPh} className="w-full rounded-full pl-5 pr-14 py-3 text-sm text-slate-800 bg-white" style={{ boxShadow: 'none' }} />
            <button onClick={() => setView('products')} className="absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full text-white flex items-center justify-center" style={{ background: BROWN_D }}><Search size={18} /></button>
          </div>
          <div className="flex-1 sm:hidden" />
          {me ? (
            <div className="relative">
              <button onClick={() => setAcctMenu(!acctMenu)} className="hidden md:flex items-center gap-1.5 border border-white/30 rounded-full px-4 py-2.5 text-sm font-bold hover:bg-white/10"><UserIcon size={16} />{me.name.split(' ')[0]}<ChevronDown size={14} /></button>
              <button onClick={() => setAcctMenu(!acctMenu)} className="md:hidden p-2.5 border border-white/30 rounded-full"><UserIcon size={17} /></button>
              {acctMenu && <div className="absolute right-0 mt-2 w-52 bg-white text-slate-700 rounded-2xl shadow-2xl overflow-hidden text-sm z-50">
                <div className="px-4 py-2.5 border-b text-xs text-slate-400">{me.email}</div>
                {me.role === 'admin'
                  ? <button onClick={() => { setAcctMenu(false); setView('admin'); }} className="w-full text-left px-4 py-2.5 hover:bg-orange-50 font-semibold flex items-center gap-2"><LayoutDashboard size={14} />{t.adminPanel}</button>
                  : <><button onClick={() => { setAcctMenu(false); setView('dashboard'); }} className="w-full text-left px-4 py-2.5 hover:bg-orange-50 font-semibold flex items-center gap-2"><LayoutDashboard size={14} />{t.dashboard}</button>
                    <button onClick={() => { setAcctMenu(false); setView('purchases'); }} className="w-full text-left px-4 py-2.5 hover:bg-orange-50 font-semibold flex items-center gap-2"><Download size={14} />{t.myPurchases}</button>
                    <button onClick={() => { setAcctMenu(false); setView('orders'); }} className="w-full text-left px-4 py-2.5 hover:bg-orange-50 font-semibold flex items-center gap-2"><History size={14} />{t.orderHistory}</button></>}
                <button onClick={logout} className="w-full text-left px-4 py-2.5 hover:bg-rose-50 text-rose-600 font-semibold flex items-center gap-2"><LogOut size={14} />{t.logout}</button>
              </div>}
            </div>
          ) : <button onClick={() => setAuthOpen('login')} className="hidden md:flex items-center gap-1.5 border border-white/30 rounded-full px-4 py-2.5 text-sm font-bold hover:bg-white/10"><UserIcon size={16} />{t.login}</button>}
          <button onClick={() => notify('🔔')} className="p-2.5 hover:bg-white/10 rounded-full"><Bell size={20} /></button>
          <button onClick={() => { if (!me) { setAuthOpen('login'); fail(t.loginRequired); return; } setView('orders'); }} className="p-2.5 hover:bg-white/10 rounded-full"><Box size={20} /></button>
          <button onClick={() => setView('cart')} className="p-2.5 hover:bg-white/10 rounded-full relative"><ShoppingCart size={20} />{cart.length > 0 && <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-[11px] w-5 h-5 rounded-full flex items-center justify-center font-bold">{cart.length}</span>}</button>
        </div>
        <div className="sm:hidden px-3 pb-3 relative">
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && setView('products')} placeholder={t.searchPh} className="w-full rounded-full pl-4 pr-12 py-2.5 text-sm text-slate-800 bg-white" />
          <button onClick={() => setView('products')} className="absolute right-4 top-1/2 -translate-y-[70%] w-9 h-9 rounded-full text-white flex items-center justify-center" style={{ background: BROWN_D }}><Search size={16} /></button>
        </div>
      </header>

      {/* ============ HOME ============ */}
      {view === 'home' && <>
        <div className="max-w-7xl mx-auto px-3 py-4 grid lg:grid-cols-[1fr_280px] gap-4">
          <div className="relative overflow-hidden rounded-[1.75rem] mesh-hero shadow-2xl shadow-orange-950/30">
          <div className="blob w-80 h-80 bg-orange-500/40 -top-16 -left-16" />
          <div className="blob w-96 h-96 bg-amber-500/25 bottom-[-6rem] right-[8%]" style={{ animationDelay: '-4s' }} />
          <div className="grid-pattern absolute inset-0" />
          <div className="relative grid lg:grid-cols-2 gap-8 items-center p-7 md:p-12 text-white">
            <div className="fade-up">
              <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-full px-3.5 py-1.5 text-[11px] font-bold tracking-[.18em] text-amber-200">✦ {lang === 'bn' ? 'প্রিমিয়াম ডিজিটাল স্টোর' : 'PREMIUM DIGITAL STORE'}</span>
              <h1 className="font-display text-4xl md:text-6xl font-black leading-[1.08] mt-4">{lang === 'bn' ? (<>ডিজিটাল প্রোডাক্ট,<br /><span className="gold-text">ইনস্ট্যান্ট অ্যাক্সেস</span></>) : (<>Digital products,<br /><span className="gold-text">instant access</span></> )}</h1>
              <p className="text-orange-100/80 text-sm md:text-base mt-4 max-w-md leading-relaxed">{lang === 'bn' ? 'পেমেন্ট ভেরিফাই হলেই Google Drive অ্যাক্সেস — কোনো অপেক্ষা নেই, কোনো ডেলিভারি চার্জ নেই।' : 'Verified payment unlocks Google Drive access instantly — no waiting, no delivery fees.'}</p>
              <div className="flex flex-wrap gap-2.5 mt-6">
                <button onClick={() => setView('products')} className="bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 text-white font-black px-7 py-3.5 rounded-full text-sm shadow-lg shadow-orange-950/40 transition flex items-center gap-1.5">{t.shopNow}<ArrowRight size={16} /></button>
                {!me && <button onClick={() => setAuthOpen('register')} className="glass px-7 py-3.5 rounded-full font-bold text-sm hover:bg-white/15 transition">{t.createAccount}</button>}
              </div>
              <div className="flex items-center gap-4 mt-8">
                <div className="flex -space-x-2.5">{['R', 'S', 'N', 'T'].map((c, i) => <span key={i} className="w-9 h-9 rounded-full border-2 border-[#3d1e07] flex items-center justify-center text-xs font-black text-white" style={{ background: ['#b45309', '#047857', '#1d4ed8', '#be123c'][i] }}>{c}</span>)}</div>
                <div className="text-xs"><div className="flex items-center gap-1">{[1, 2, 3, 4, 5].map(s => <Star key={s} size={11} className="fill-amber-400 text-amber-400" />)}<b className="ml-1">4.9</b></div><span className="text-orange-100/70">{users.filter(u => u.role === 'customer').length * 1240}+ happy customers</span></div>
                <div className="h-10 w-px bg-white/15" />
                <div><div className="font-display font-black text-2xl">{activeProducts.length * 36}+</div><div className="text-[11px] text-orange-100/70">products sold</div></div>
              </div>
            </div>
            <div className="relative">
              {hero && (
                <div key={hero.id + slide} className="slide-in relative mx-auto max-w-md">
                  <div className="float-slow"><img src={hero.previewImages[0] || IMG(hero.id)} alt={hero.name} className="w-full h-64 md:h-80 object-cover rounded-3xl shadow-2xl rotate-2 border border-white/20" onError={e => { const im = e.target as HTMLImageElement; im.onerror = null; im.src = IMG(hero.id); }} /></div>
                  <div className="absolute -left-2 md:-left-6 bottom-8 glass rounded-2xl px-4 py-3 float-slower shadow-xl">
                    <div className="text-[10px] text-orange-200/80 font-bold tracking-wider">{t.grandTotal}</div>
                    <div className="font-display font-black text-2xl text-white">{tk(eff(hero))}</div>
                    <button onClick={() => goDetails(hero.id)} className="mt-1.5 bg-gradient-to-r from-orange-400 to-amber-500 text-[11px] font-black px-4 py-2 rounded-full shadow">{t.orderNow}</button>
                  </div>
                  <div className="absolute -right-1 md:-right-4 top-6 glass rounded-2xl px-3.5 py-2.5 flex items-center gap-2 float-slow shadow-xl" style={{ animationDelay: '-2.5s' }}>
                    <BadgeCheck size={20} className="text-emerald-300 shrink-0" />
                    <div className="text-[11px] font-bold text-white leading-tight">{t.verifiedPay}<br /><span className="text-orange-200/70 font-medium">{t.instantAccess}</span></div>
                  </div>
                </div>
              )}
              {slides.length > 1 && <>
                <button onClick={() => setSlide((slide - 1 + slides.length) % slides.length)} className="absolute left-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white items-center justify-center text-slate-700 hidden md:flex"><ChevronLeft size={18} /></button>
                <button onClick={() => setSlide((slide + 1) % slides.length)} className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white items-center justify-center text-slate-700 hidden md:flex"><ChevronRight size={18} /></button>
                <div className="flex justify-center gap-1.5 mt-4">{slides.map((s, i) => <button key={s.id} onClick={() => setSlide(i)} className={`h-2 rounded-full transition-all ${i === slide ? 'w-7 bg-amber-400' : 'w-2 bg-white/40'}`} />)}</div>
              </>}
            </div>
          </div>
        </div>
          <div className="bg-white rounded-2xl p-3 grid gap-2 content-start shadow-sm">
            {trustItems.map(([Icon, label]) => (
              <div key={label} className="flex items-center gap-3 bg-white border border-orange-100 hover:border-orange-300 hover:shadow-lg hover:shadow-orange-100 rounded-2xl px-4 py-3 transition cursor-default">
                <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center shrink-0"><Icon size={18} style={{ color: BROWN }} /></span>
                <span className="text-sm font-semibold text-slate-700">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-3 grid lg:grid-cols-[1fr_340px] gap-6 items-start">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-black text-lg md:text-xl text-slate-800 flex items-center gap-2 reveal"><LayoutGrid size={19} style={{ color: BROWN }} />{t.shopByCat}</h2>
              <button onClick={() => { setCatFilter('All'); setView('products'); }} className="text-xs font-bold flex items-center gap-1 hover:gap-2 transition-all" style={{ color: BROWN }}>{t.seeAll}<ChevronRight size={14} /></button>
            </div>
            <div className="flex gap-5 overflow-x-auto no-scrollbar pb-2 stagger-in">
              {activeCats.map(c => (
                <button key={c.id} onClick={() => { setCatFilter(c.id); setView('products'); }} className="flex flex-col items-center gap-2 shrink-0 group">
                  {c.image ? <img src={c.image} alt={c.name} className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover ring-4 ring-orange-100 group-hover:ring-orange-300 transition" onError={e => { const im = e.target as HTMLImageElement; im.onerror = null; im.src = IMG(c.id, 200); }} />
                    : <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-orange-200 to-amber-100 flex items-center justify-center ring-4 ring-orange-100"><Tag size={26} style={{ color: BROWN }} /></div>}
                  <span className="text-xs font-medium text-slate-600 whitespace-nowrap">{c.name}</span>
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => setView('products')} className="relative rounded-2xl overflow-hidden text-left group reveal">
            <img src={settings.promoImage || IMG('promo', 800)} alt="" className="w-full h-36 md:h-44 object-cover group-hover:scale-105 transition duration-500" onError={e => { const im = e.target as HTMLImageElement; im.onerror = null; im.src = IMG('promo', 800); }} />
            <span className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[11px] font-black bg-white px-4 py-1.5 rounded-full whitespace-nowrap" style={{ color: BROWN }}>{settings.promoTitle} • {t.shopNow}</span>
          </button>
        </div>

        <main className="max-w-7xl mx-auto px-3 py-6">
          <h2 className="font-display font-black text-xl md:text-2xl text-slate-800 mb-4 flex items-center gap-2 reveal"><span className="w-1.5 h-7 rounded-full" style={{ background: BROWN }} /><Zap size={20} style={{ color: BROWN }} />{t.newTrending}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4 stagger-in">{activeProducts.slice(0, 5).map(p => <ProductCard key={p.id} p={p} />)}</div>
          <h2 className="font-display font-black text-xl md:text-2xl text-slate-800 mt-10 mb-4 flex items-center gap-2 reveal"><span className="w-1.5 h-7 rounded-full" style={{ background: BROWN }} />{t.latestProducts}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4 stagger-in">{[...activeProducts].reverse().slice(0, 5).map(p => <ProductCard key={p.id} p={p} />)}</div>

          <div className="mt-12 bg-white border border-orange-100 rounded-[1.75rem] p-6 md:p-10 reveal">
            <div className="text-center text-[11px] font-black tracking-[.25em] text-amber-600">✦ HOW IT WORKS ✦</div>
            <h2 className="font-display font-black text-2xl md:text-3xl text-slate-800 text-center mt-1">{t.howTitle}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mt-7">
              {([[Search, t.s1T, t.s1D], [ShoppingCart, t.s2T, t.s2D], [BadgeCheck, t.s3T, t.s3D], [Download, t.s4T, t.s4D]] as [typeof Search, string, string][]).map(([Icon, title, desc], i) => (
                <div key={title} className="relative bg-[#faf4ec] hover:bg-orange-50 border border-transparent hover:border-orange-200 rounded-2xl p-5 text-center transition group">
                  <span className="absolute top-3 right-4 font-display font-black text-3xl text-orange-200 group-hover:text-orange-300 transition">{i + 1}</span>
                  <span className="inline-flex w-14 h-14 rounded-2xl items-center justify-center text-white shadow-lg shadow-orange-900/20" style={{ background: `linear-gradient(135deg, ${BROWN}, #8a4a12)` }}><Icon size={22} /></span>
                  <div className="font-black text-slate-800 mt-3">{title}</div>
                  <div className="text-xs text-slate-500 mt-1">{desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 reveal">
            <h2 className="font-display font-black text-xl md:text-2xl text-slate-800 mb-4 flex items-center gap-2"><span className="w-1.5 h-7 rounded-full" style={{ background: BROWN }} /><Star size={20} className="fill-amber-400 text-amber-400" />{t.testiTitle}</h2>
            <div className="grid md:grid-cols-3 gap-3 md:gap-4">
              {([
                ['পেমেন্টের ১০ মিনিটের মধ্যে Drive লিংক পেয়ে গেছি। Super fast service!', 'Rahat Hossain', 'Graphic Designer', '#b45309'],
                ['Bundle quality is top-notch. Best digital store in Bangladesh.', 'Nusrat Jahan', 'Freelancer', '#047857'],
                ['WhatsApp support is amazing. Highly recommended!', 'Tanvir Ahmed', 'YouTuber', '#1d4ed8'],
              ] as [string, string, string, string][]).map(([q, n, r, c]) => (
                <div key={n} className="bg-white border border-slate-100 rounded-3xl p-5 card-hover">
                  <div className="flex gap-0.5">{[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} className="fill-amber-400 text-amber-400" />)}</div>
                  <p className="text-sm text-slate-600 mt-2.5 leading-relaxed">“{q}”</p>
                  <div className="flex items-center gap-2.5 mt-4">
                    <span className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black" style={{ background: c }}>{n[0]}</span>
                    <div><div className="text-sm font-black text-slate-800">{n}</div><div className="text-[11px] text-slate-400">{r} • <span className="text-emerald-600 font-bold">✓ Verified Buyer</span></div></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </>}

      {/* ============ PRODUCTS ============ */}
      {view === 'products' && (
        <main className="max-w-7xl mx-auto px-3 py-6">
          <h2 className="font-display font-black text-xl md:text-2xl text-slate-800">{t.allProducts}</h2>
          <p className="text-sm text-slate-500 mb-4">{filtered.length} {t.found}</p>
          <div className="bg-white rounded-2xl border p-3 mb-5 grid gap-2 md:grid-cols-4 shadow-sm">
            <div className="relative md:col-span-2"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.searchPh} className="w-full border rounded-xl pl-9 pr-3 py-2.5 text-sm" /></div>
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="border rounded-xl px-3 py-2.5 text-sm"><option value="All">{t.allCats}</option>{activeCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder={t.maxPrice} className="border rounded-xl px-3 py-2.5 text-sm" />
              <select value={sort} onChange={e => setSort(e.target.value)} className="border rounded-xl px-3 py-2.5 text-sm"><option value="popular">{t.popular}</option><option value="new">{t.newest}</option><option value="low">{t.lowHigh}</option><option value="high">{t.highLow}</option></select>
            </div>
          </div>
          {filtered.length === 0 ? <div className="bg-white rounded-2xl p-10 text-center text-slate-500 text-sm">—</div> : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4 stagger-in">{filtered.map(p => <ProductCard key={p.id} p={p} />)}</div>)}
        </main>
      )}

      {/* ============ DETAILS ============ */}
      {view === 'details' && detail && (
        <main className="max-w-7xl mx-auto px-3 py-4">
          <div className="text-xs text-slate-500 mb-3 flex items-center gap-1.5"><button onClick={() => setView('home')} className="hover:text-[#7c2d12]">{t.home}</button><ChevronRight size={12} /><span className="text-slate-800 font-medium truncate">{detail.name}</span></div>
          <div className="grid lg:grid-cols-[380px_1fr_300px] gap-4 items-start">
            <div>
              <div className="relative bg-white rounded-2xl overflow-hidden border">
                <img src={detail.previewImages[gal] || IMG(detail.id, 700)} alt="" className="w-full aspect-square object-cover" onError={e => { const im = e.target as HTMLImageElement; im.onerror = null; im.src = IMG(detail.id, 700); }} />
                {offPct(detail) > 0 && <span className="absolute top-3 left-0 text-white text-xs font-black px-3 py-1.5 rounded-r-full flex items-center gap-1" style={{ background: BROWN }}><Zap size={12} className="fill-orange-400 text-orange-400" />{offPct(detail)}% {t.off}</span>}
              </div>
              {detail.previewImages.length > 1 && <div className="flex gap-2 mt-2">{detail.previewImages.map((src, i) => <button key={i} onClick={() => setGal(i)} className={`w-16 h-16 rounded-xl overflow-hidden border-2 ${gal === i ? 'border-[#5a2e0d]' : 'border-transparent'}`}><img src={src} alt="" className="w-full h-full object-cover" /></button>)}</div>}
            </div>
            <div className="bg-white rounded-2xl border p-5">
              <h1 className="font-display font-bold text-xl md:text-2xl text-slate-800">{detail.name}</h1>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full"><Zap size={13} />{t.instantUnlock}</span>
                {owns(sessionId, detail.id) && <span className="inline-flex items-center gap-1 text-xs font-bold text-white bg-emerald-500 px-2.5 py-1 rounded-full"><Check size={13} />{t.accessUnlocked}</span>}
              </div>
              <div className="flex items-baseline gap-2 mt-3"><span className="font-display font-black text-3xl" style={{ color: BROWN }}>{tk(eff(detail))}</span>{offPct(detail) > 0 && <s className="text-slate-400">{tk(detail.price)}</s>}</div>
              <div className="flex items-center gap-1 mt-1 text-xs text-slate-500"><Star size={13} className="fill-amber-400 text-amber-400" />{detail.rating} • {detail.reviews.length} {t.reviews.toLowerCase()} • {detail.sold.toLocaleString()} sold</div>
              {owns(sessionId, detail.id) ? (
                <button onClick={() => openAccess(sessionId, detail.id)} className="w-full mt-5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-black py-3.5 rounded-xl flex items-center justify-center gap-1.5 transition"><Download size={16} />{t.alreadyPurchased}</button>
              ) : (
                <><div className="grid grid-cols-2 gap-2 mt-5">
                  <button onClick={() => addCart(detail.id)} className="border-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2 py-3 transition hover:bg-orange-50" style={{ borderColor: BROWN, color: BROWN }}><ShoppingCart size={17} />{t.addToCart}</button>
                  <button onClick={() => buyNow(detail.id)} className="text-white text-sm font-black py-3 rounded-xl" style={{ background: BROWN }}>{t.buyNow}</button>
                </div></>
              )}
              <p className="text-[11px] text-slate-400 mt-2">🔒 {t.pendingNote}</p>
            </div>
            <div className="grid gap-4">
              <div className="bg-white rounded-2xl border p-4">
                <div className="text-[11px] font-black tracking-wider text-slate-400 flex items-center gap-1.5 mb-2"><Download size={14} />{t.accessInfo}</div>
                <div className="grid gap-2 text-[13px] text-slate-600">
                  <span className="flex items-center gap-2 bg-[#faf4ec] rounded-lg px-3 py-2"><Zap size={15} style={{ color: BROWN }} />{t.instantUnlock}</span>
                  <span className="flex items-center gap-2 bg-[#faf4ec] rounded-lg px-3 py-2"><Download size={15} style={{ color: BROWN }} />{t.lifetimeAccess}</span>
                  <span className="flex items-center gap-2 bg-[#faf4ec] rounded-lg px-3 py-2"><ShieldCheck size={15} style={{ color: BROWN }} />{t.securePay}</span>
                </div>
              </div>
              <div className="bg-white rounded-2xl border p-4">
                <div className="text-[11px] font-black tracking-wider text-slate-400 flex items-center gap-1.5 mb-2"><BadgeCheck size={14} />{t.policies}</div>
                <div className="text-sm text-slate-600 grid gap-1.5"><span className="flex items-center gap-2"><ShieldCheck size={15} className="text-slate-400" />{t.securePay}</span><span className="flex items-center gap-2"><Headphones size={15} className="text-slate-400" />{t.support247}</span></div>
              </div>
              <div className="bg-white rounded-2xl border p-4 text-center">
                <div className="text-[11px] font-black tracking-wider text-slate-400 mb-2">{t.needHelp}?</div>
                <div className="flex justify-center gap-2">
                  <a href={waLink(settings.whatsapp, detail.name)} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl text-white flex items-center justify-center" style={{ background: BROWN }}><MessageCircle size={18} /></a>
                  <a href={settings.facebook} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl text-white flex items-center justify-center" style={{ background: BROWN }}><Facebook size={18} /></a>
                  <a href={settings.telegram} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl text-white flex items-center justify-center" style={{ background: BROWN }}><Send size={18} /></a>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border mt-4 overflow-hidden">
            <div className="grid grid-cols-2 text-sm font-black tracking-wider">
              <button onClick={() => setTab('desc')} className={`py-4 ${tab === 'desc' ? 'text-[#5a2e0d] border-b-2 border-[#5a2e0d] bg-orange-50/40' : 'text-slate-400'}`}>{t.description}</button>
              <button onClick={() => setTab('rev')} className={`py-4 ${tab === 'rev' ? 'text-[#5a2e0d] border-b-2 border-[#5a2e0d] bg-orange-50/40' : 'text-slate-400'}`}>{t.reviews} ({detail.reviews.length})</button>
            </div>
            <div className="p-5 md:p-8">
              {tab === 'desc' ? (
                <div className="grid gap-2.5 text-sm text-slate-600 max-w-3xl">
                  <p className="leading-relaxed">{detail.description}</p>
                  {detail.features.map(f => <p key={f} className="leading-relaxed">✅ {f}</p>)}
                </div>
              ) : (
                <div className="max-w-2xl">
                  {detail.reviews.length === 0 ? <p className="text-sm text-slate-500">{t.noReviews}</p> : detail.reviews.map((r, i) => (
                    <div key={i} className="border-b py-3 text-sm"><div className="flex items-center gap-2"><b>{r.name}</b><span className="flex">{[1, 2, 3, 4, 5].map(s => <Star key={s} size={12} className={s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />)}</span><span className="text-xs text-slate-400">{r.date}</span></div><p className="text-slate-600 mt-1">{r.text}</p></div>
                  ))}
                  <h4 className="font-bold text-sm mt-4">{t.writeReview}</h4>
                  <div className="grid gap-2 mt-2 text-sm">
                    <div className="flex flex-wrap gap-2 items-center">
                      <input value={revName} onChange={e => setRevName(e.target.value)} placeholder={t.yourName} className="flex-1 min-w-[140px] border rounded-xl px-3 py-2" />
                      <div className="flex gap-0.5">{[1, 2, 3, 4, 5].map(s => <button key={s} onClick={() => setRevStars(s)}><Star size={20} className={s <= revStars ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} /></button>)}</div>
                    </div>
                    <textarea value={revText} onChange={e => setRevText(e.target.value)} placeholder={t.yourReview} rows={3} className="border rounded-xl px-3 py-2" />
                    <button onClick={addReview} className="text-white font-bold py-2.5 rounded-xl w-fit px-8" style={{ background: BROWN }}>{t.submit}</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      )}

      {/* ============ CART ============ */}
      {view === 'cart' && (
        <main className="max-w-7xl mx-auto px-3 py-6">
          <h2 className="font-display font-black text-2xl text-slate-800 flex items-center gap-2"><ShoppingCart size={24} style={{ color: BROWN }} />{t.cart} <span className="text-xs font-bold bg-orange-100 px-3 py-1.5 rounded-full" style={{ color: BROWN }}>{cartDetailed.length} {t.items}</span></h2>
          {cartDetailed.length === 0 ? <div className="bg-white rounded-2xl border p-12 text-center text-slate-500 text-sm mt-4">{t.cartEmpty}<br /><button onClick={() => setView('products')} className="mt-3 text-white text-xs font-bold px-6 py-2.5 rounded-xl" style={{ background: BROWN }}>{t.continueShopping}</button></div> : (
            <div className="grid lg:grid-cols-[1fr_340px] gap-4 mt-4 items-start">
              <div>
                <div className="bg-white rounded-2xl border px-5 py-3 hidden md:grid grid-cols-[1fr_120px_120px] text-[11px] font-black tracking-wider text-slate-400"><span>PRODUCT</span><span>{t.price.toUpperCase()}</span><span className="text-right">{t.total.toUpperCase()}</span></div>
                <div className="grid gap-3 mt-3">
                  {cartDetailed.map(x => (
                    <div key={x.productId} className="bg-white rounded-2xl border p-4 grid md:grid-cols-[1fr_120px_120px] gap-3 items-center">
                      <div className="flex gap-3 items-center">
                        <img src={x.p.previewImages[0] || IMG(x.p.id, 200)} alt="" className="w-20 h-20 rounded-xl object-cover cursor-pointer" onClick={() => goDetails(x.p.id)} onError={e => { const im = e.target as HTMLImageElement; im.onerror = null; im.src = IMG(x.p.id, 200); }} />
                        <div className="min-w-0"><div className="font-bold text-sm text-slate-800 line-clamp-2 cursor-pointer" onClick={() => goDetails(x.p.id)}>{x.p.name}</div>
                          <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 rounded-md px-2 py-0.5 mt-1.5">{t.digitalTag} • {t.instantUnlock}</span></div>
                      </div>
                      <div className="font-bold text-slate-800">{tk(eff(x.p))}</div>
                      <div className="flex md:flex-col items-center md:items-end justify-between gap-1"><b className="font-display text-lg" style={{ color: BROWN }}>{tk(eff(x.p))}</b>
                        <button onClick={() => setCart(cart.filter(c => c.productId !== x.productId))} className="text-slate-300 hover:text-rose-500 flex items-center gap-1 text-xs"><Trash2 size={15} />{t.remove}</button></div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-4">
                  <button onClick={() => setView('products')} className="text-sm font-bold text-slate-500 flex items-center gap-1.5 hover:text-[#7c2d12]"><ArrowLeft size={16} />{t.continueShopping}</button>
                  <button onClick={() => setCart([])} className="text-xs text-slate-400 flex items-center gap-1"><Trash2 size={12} />{t.emptyCart}</button>
                </div>
              </div>
              <div className="bg-white rounded-2xl border p-5">
                <h3 className="font-display font-black text-lg text-slate-800 flex items-center justify-between">{t.orderSummary}<ShoppingCart size={18} className="text-slate-300" /></h3>
                <div className="border-t border-dashed mt-3 pt-3 grid gap-2 text-sm">
                  <div className="flex justify-between text-slate-600"><span>{t.subtotal} ({cartDetailed.length})</span><b className="text-slate-800">{tk(subtotal)}</b></div>
                  <div className="flex justify-between items-center text-slate-600"><span>{t.shipping}</span><span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{t.free} (digital)</span></div>
                </div>
                <div className="border-t border-dashed mt-3 pt-3 flex justify-between items-center"><span className="font-display font-black text-lg">{t.grandTotal}</span><span className="font-display font-black text-2xl" style={{ color: BROWN }}>{tk(subtotal)}</span></div>
                <button onClick={() => { if (!me) { setAuthOpen('login'); fail(t.loginRequired); return; } setView('checkout'); }} className="w-full mt-4 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg" style={{ background: BROWN }}>{t.proceedCheckout}<ArrowRight size={17} /></button>
                <p className="text-center text-[11px] font-bold tracking-wider text-slate-400 mt-3 flex items-center justify-center gap-1.5">🛡️ {t.secureCheckout}</p>
              </div>
            </div>)}
        </main>
      )}

      {/* ============ CHECKOUT (digital: no address, no delivery) ============ */}
      {view === 'checkout' && (
        <main className="max-w-5xl mx-auto px-3 py-6">
          <h2 className="font-display font-black text-2xl text-slate-800">{t.checkout}</h2>
          <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 mt-2">⚡ {t.digitalNote}</p>
          {cartDetailed.length === 0 && !orderPlaced ? <div className="bg-white rounded-2xl border p-12 text-center text-slate-500 text-sm mt-4">{t.cartEmpty}</div> : (
            <div className="grid md:grid-cols-[1fr_320px] gap-4 mt-4 items-start">
              <div className="bg-white rounded-2xl border p-5 grid gap-3 text-sm">
                <div className="text-xs font-black tracking-wider text-slate-400">{t.payMethod.toUpperCase()}</div>
                {payNumbers.map(([l, n, c]) => (
                  <label key={l} className={`flex flex-wrap items-center gap-x-2.5 gap-y-1.5 border rounded-xl px-3.5 py-3 cursor-pointer ${payMethod === l ? 'border-[#5a2e0d] bg-orange-50/60' : ''}`}>
                    <input type="radio" checked={payMethod === l} onChange={() => setPayMethod(l)} className="accent-[#5a2e0d] shrink-0" />
                    <span className="text-white text-[10px] font-black px-2 py-0.5 rounded shrink-0" style={{ background: c }}>{l}</span>
                    <span className="font-mono font-bold text-[13px] break-all">{n}</span>
                    <button onClick={() => copy(n, l)} className="ml-auto text-[11px] text-white px-2.5 py-1.5 rounded-lg flex items-center gap-1 shrink-0" style={{ background: BROWN }}>{copied === l ? <Check size={12} /> : <Copy size={12} />}Copy</button>
                  </label>
                ))}
                <input value={trxId} onChange={e => setTrxId(e.target.value)} placeholder={t.trxId} className="border rounded-xl px-3.5 py-3 font-mono" />
                <p className="text-[11px] text-slate-400">🔒 {t.pendingNote}</p>
              </div>
              <div className="bg-white rounded-2xl border p-5">
                <h3 className="font-display font-black text-lg">{t.orderSummary}</h3>
                <div className="grid gap-1.5 text-xs text-slate-600 mt-2 max-h-40 overflow-y-auto">{cartDetailed.map(x => <div key={x.productId} className="flex justify-between gap-2"><span className="truncate">{x.p.name}</span><b>{tk(eff(x.p))}</b></div>)}</div>
                <div className="flex gap-2 mt-3"><input value={couponInput} onChange={e => setCouponInput(e.target.value.toUpperCase())} placeholder={t.coupon} className="flex-1 border rounded-xl px-3 py-2.5 font-mono uppercase text-xs" /><button onClick={() => { const v = couponValue(couponInput); if (v) { setAppliedCoupon(couponInput.trim().toUpperCase()); notify('✓ ' + t.couponApplied); } else fail(t.invalidCoupon); }} className="text-white text-xs font-bold px-4 rounded-xl" style={{ background: BROWN }}>{t.apply}</button></div>
                <div className="grid gap-1.5 text-sm mt-3">
                  <div className="flex justify-between text-slate-600"><span>{t.subtotal}</span><b>{tk(subtotal)}</b></div>
                  <div className="flex justify-between text-emerald-600"><span>{t.shipping}</span><b>{t.free}</b></div>
                  {couponDisc > 0 && <div className="flex justify-between text-emerald-600"><span>{t.discount} ({appliedCoupon})</span><b>-{tk(couponDisc)}</b></div>}
                  <div className="flex justify-between items-center border-t border-dashed pt-2"><span className="font-display font-black">{t.grandTotal}</span><span className="font-display font-black text-2xl" style={{ color: BROWN }}>{tk(total)}</span></div>
                </div>
                <button onClick={placeOrder} className="w-full mt-4 text-white font-black py-4 rounded-2xl shadow-lg" style={{ background: BROWN }}>{t.payPlaceOrder} • {tk(total)}</button>
              </div>
            </div>)}
        </main>
      )}

      {/* ============ DASHBOARD ============ */}
      {view === 'dashboard' && (!me || me.role !== 'customer') && (
        <main className="max-w-5xl mx-auto px-3 py-6">
          <div className="bg-white rounded-2xl border p-10 text-center text-sm text-slate-500">{t.loginRequired} <button onClick={() => setAuthOpen('login')} className="font-bold" style={{ color: BROWN }}>{t.login} →</button></div>
        </main>
      )}
      {view === 'dashboard' && me && me.role === 'customer' && (
        <main className="max-w-5xl mx-auto px-3 py-6">
          <h2 className="font-display font-black text-2xl text-slate-800">👋 {me.name}</h2>
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[[String(myPurchases.length), t.totalPurchased], [String(myOrders.length), t.orderHistory], [tk(myOrders.filter(o => o.paymentStatus === 'Paid').reduce((s, o) => s + o.total, 0)), t.totalSpent]].map(([v, l]) => (
              <div key={l as string} className="text-white rounded-2xl p-4" style={{ background: `linear-gradient(135deg, ${BROWN}, #8a4a12)` }}><div className="text-xl md:text-2xl font-black font-display">{v as string}</div><div className="text-xs opacity-80">{l as string}</div></div>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div className="bg-white rounded-2xl border p-4"><div className="flex items-center justify-between mb-2"><h3 className="font-bold">⚡ {t.quickDownload}</h3><button onClick={() => setView('purchases')} className="text-xs font-bold" style={{ color: BROWN }}>{t.viewAll} →</button></div>
              {myPurchases.length === 0 ? <p className="text-sm text-slate-500">{t.cartEmpty} <button onClick={() => setView('products')} className="font-bold" style={{ color: BROWN }}>→</button></p> :
                myPurchases.slice(0, 3).map(pu => { const pr = products.find(x => x.id === pu.productId); return pr ? <button key={pu.id} onClick={() => openAccess(sessionId, pr.id)} className="w-full flex items-center gap-2 border rounded-xl p-2 mb-2 hover:border-emerald-400 text-left"><img src={pr.previewImages[0] || IMG(pr.id, 200)} alt="" className="w-12 h-12 rounded-lg object-cover" onError={e => { const im = e.target as HTMLImageElement; im.onerror = null; im.src = IMG(pr.id, 200); }} /><span className="flex-1 text-xs font-bold truncate">{pr.name}</span><Download size={15} className="text-emerald-600" /></button> : null; })}</div>
            <div className="bg-white rounded-2xl border p-4"><div className="flex items-center justify-between mb-2"><h3 className="font-bold">🧾 {t.recentOrders}</h3><button onClick={() => setView('orders')} className="text-xs font-bold" style={{ color: BROWN }}>{t.viewAll} →</button></div>
              {myOrders.length === 0 ? <p className="text-sm text-slate-500">—</p> :
                myOrders.slice(0, 3).map(o => <div key={o.id} className="flex items-center justify-between border rounded-xl px-3 py-2 mb-2 text-xs"><span className="font-mono font-bold">{o.id}</span><span className={`px-2 py-0.5 rounded-full font-bold ${payBadge(o.paymentStatus)}`}>{o.paymentStatus}</span><b>{tk(o.total)}</b></div>)}</div>
          </div>
        </main>
      )}

      {/* ============ PURCHASES ============ */}
      {view === 'purchases' && (
        <main className="max-w-5xl mx-auto px-3 py-6">
          <h2 className="font-display font-black text-2xl text-slate-800">📚 {t.myPurchases}</h2>
          <p className="text-sm text-slate-500 mb-4">{t.pendingNote}</p>
          {!me ? <div className="bg-white rounded-2xl border p-10 text-center text-sm text-slate-500">{t.loginRequired} <button onClick={() => setAuthOpen('login')} className="font-bold" style={{ color: BROWN }}>{t.login} →</button></div>
            : myPurchases.length === 0 ? <div className="bg-white rounded-2xl border p-10 text-center text-sm text-slate-500">{t.verifyPending}… <button onClick={() => setView('products')} className="font-bold" style={{ color: BROWN }}>→</button></div>
              : <div className="grid md:grid-cols-2 gap-3">{myPurchases.map(pu => {
                const pr = products.find(x => x.id === pu.productId); if (!pr) return null;
                return <div key={pu.id} className="bg-white rounded-2xl border p-3 flex gap-3">
                  <img src={pr.previewImages[0] || IMG(pr.id, 200)} alt="" className="w-24 h-24 rounded-xl object-cover cursor-pointer" onClick={() => goDetails(pr.id)} onError={e => { const im = e.target as HTMLImageElement; im.onerror = null; im.src = IMG(pr.id, 200); }} />
                  <div className="flex-1 min-w-0"><div className="font-bold text-sm truncate">{pr.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{t.purchasedOn}: {pu.purchasedAt} • <span className="font-mono">{pu.orderId}</span></div>
                    <button onClick={() => openAccess(sessionId, pr.id)} className="mt-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black px-4 py-2 rounded-xl flex items-center gap-1.5 transition"><Download size={13} />{t.download}</button></div>
                </div>;
              })}</div>}
        </main>
      )}

      {/* ============ ORDERS ============ */}
      {view === 'orders' && (
        <main className="max-w-5xl mx-auto px-3 py-6">
          <h2 className="font-display font-black text-2xl text-slate-800 flex items-center gap-2"><History size={22} style={{ color: BROWN }} />{t.orderHistory}</h2>
          {!me ? <div className="bg-white rounded-2xl border p-10 text-center text-sm text-slate-500 mt-4">{t.loginRequired} <button onClick={() => setAuthOpen('login')} className="font-bold" style={{ color: BROWN }}>{t.login} →</button></div>
            : myOrders.length === 0 ? <div className="bg-white rounded-2xl border p-10 text-center text-sm text-slate-500 mt-4">—</div>
              : <div className="grid gap-3 mt-4">{myOrders.map(o => (
                <div key={o.id} className="bg-white rounded-2xl border p-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2 justify-between"><span className="font-mono font-bold">{o.id}</span><span className={`text-xs px-2 py-1 rounded-full font-bold ${payBadge(o.paymentStatus)}`}>{o.paymentStatus}</span></div>
                  <div className="text-xs text-slate-500 mt-1">{o.items.map(i => i.name).join(', ')}</div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-600"><span>{t.grandTotal}: <b>{tk(o.total)}</b></span><span>{o.paymentMethod}</span><span>{o.createdAt}</span><span>{t.download}: {o.paymentStatus === 'Paid' ? <b className="text-emerald-600">{t.accessUnlocked} ✓</b> : <span className="text-amber-600">{t.accessLocked}</span>}</span></div>
                  {o.paymentStatus === 'Paid' && <div className="flex gap-2 mt-2 flex-wrap">{o.items.map(i => <button key={i.productId} onClick={() => openAccess(sessionId, i.productId)} className="text-xs bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"><Download size={12} />{t.download}</button>)}</div>}
                </div>
              ))}</div>}
        </main>
      )}

      {/* footer */}
      <footer className="text-orange-100/70 mt-10" style={{ background: BROWN_D }}>
        <div className="max-w-7xl mx-auto px-4 py-10 grid gap-8 md:grid-cols-4 text-sm">
          <div><Logo /><p className="mt-3 text-xs leading-relaxed">{t.digitalNote}</p>
            <div className="flex gap-2 mt-3">
              <a href={settings.facebook} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"><Facebook size={16} /></a>
              <a href={settings.youtube} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"><Youtube size={16} /></a>
              <a href={settings.instagram} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"><Instagram size={16} /></a>
              <a href={settings.telegram} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"><Send size={16} /></a>
            </div></div>
          <div><h4 className="text-white font-black mb-3 text-xs tracking-widest">SHOP</h4><div className="grid gap-2">{activeCats.map(c => <button key={c.id} onClick={() => { setCatFilter(c.id); setView('products'); }} className="text-left hover:text-white">{c.name}</button>)}</div></div>
          <div><h4 className="text-white font-black mb-3 text-xs tracking-widest">HELP</h4><div className="grid gap-2">
            <button onClick={() => setView('orders')} className="text-left hover:text-white">{t.myOrders}</button>
            <button onClick={() => setView('purchases')} className="text-left hover:text-white">{t.library}</button>
            <a href={waLink(settings.whatsapp, 'Support')} target="_blank" rel="noreferrer" className="hover:text-white">{t.support}</a>
            <span>{t.securePay} • {t.instantAccess}</span></div></div>
          <div><h4 className="text-white font-black mb-3 text-xs tracking-widest">CONTACT</h4><div className="grid gap-2 text-xs">
            <span className="flex items-center gap-2"><Phone size={14} />{settings.whatsapp}</span>
            <span className="flex items-center gap-2"><MapPin size={14} />Dhaka, Bangladesh</span></div></div>
        </div>
        <div className="border-t border-white/10"><div className="max-w-7xl mx-auto px-4 py-4 text-xs flex flex-wrap gap-2 items-center justify-between"><span>© 2026 <b className="text-white">{settings.storeName}</b> — {t.rights}</span><span>bKash • Nagad • Rocket • Binance</span></div></div>
      </footer>

      {/* whatsapp float */}
      <a href={waLink(settings.whatsapp, t.supportTitle)} target="_blank" rel="noreferrer" className="fixed bottom-5 right-5 z-40 bg-[#25d366] w-14 h-14 rounded-full flex items-center justify-center shadow-2xl float-wa" title="Chat">
        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40 animate-ping" />
        <MessageCircle size={28} className="text-white relative" />
      </a>

      {/* order success (pending verification) */}
      {orderPlaced && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={() => setOrderPlaced(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-center fade-up" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto"><Check size={30} style={{ color: BROWN }} /></div>
            <h3 className="font-black text-xl mt-2">{t.orderSuccess}</h3>
            <p className="text-sm text-slate-500 mt-1">{t.pendingNote}</p>
            <div className="bg-[#faf4ec] border border-dashed border-[#d6b48c] rounded-xl p-3 mt-3 text-sm">{t.orderId}: <b className="font-mono">{orderPlaced.id}</b><br />{t.grandTotal}: <b>{tk(orderPlaced.total)}</b> • <span className="text-amber-600 font-bold">{t.verifyPending}</span></div>
            <button onClick={() => { setOrderPlaced(null); setView('orders'); }} className="mt-3 w-full text-white font-bold py-3 rounded-2xl text-sm" style={{ background: BROWN }}>{t.orderHistory}</button>
            <button onClick={() => { setOrderPlaced(null); setView('home'); }} className="mt-2 w-full bg-slate-100 font-bold py-3 rounded-2xl text-sm">{t.continueShopping}</button>
          </div>
        </div>
      )}

      {/* auth */}
      {authOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => { setAuthOpen(null); setPendingBuy(null); }}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm fade-up" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center"><div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-2xl" style={{ background: BROWN }}>M</div></div>
            <h3 className="font-black text-center mt-2 text-lg">{authOpen === 'login' ? t.welcomeBack : t.createAccount}</h3>
            <p className="text-[11px] text-center text-slate-400">demo@demo.com / demo123</p>
            <div className="grid gap-2 mt-3 text-sm">
              {authOpen === 'register' && <input className="border rounded-xl px-3 py-2.5" placeholder={t.name} value={authForm.name} onChange={e => setAuthForm({ ...authForm, name: e.target.value })} />}
              <input className="border rounded-xl px-3 py-2.5" placeholder={t.email} value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} />
              <input type="password" className="border rounded-xl px-3 py-2.5" placeholder={t.password} value={authForm.pass} onChange={e => setAuthForm({ ...authForm, pass: e.target.value })} onKeyDown={e => e.key === 'Enter' && (authOpen === 'login' ? doLogin() : doRegister())} />
              {authErr && <p className="text-xs text-rose-600 flex items-center gap-1"><AlertCircle size={13} />{authErr}</p>}
              <button onClick={authOpen === 'login' ? doLogin : doRegister} className="text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-1.5" style={{ background: BROWN }}><LogIn size={15} />{authOpen === 'login' ? t.login : t.register}</button>
              <button onClick={() => { setAuthErr(''); setAuthOpen(authOpen === 'login' ? 'register' : 'login'); }} className="text-xs font-bold" style={{ color: BROWN }}>{authOpen === 'login' ? t.newHere : t.haveAccount}</button>
            </div>
          </div>
        </div>
      )}

      {(toast || err) && <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-2xl toast-in max-w-[92vw] text-center ${err ? 'bg-rose-600' : ''}`} style={err ? {} : { background: BROWN_D }}>{err || toast}</div>}
    </div>
  );
}
