import { useEffect, useMemo, useState } from 'react';
import {
  Search, ShoppingCart, X, Plus, Trash2, Star, MessageCircle, Copy, Check,
  LayoutDashboard, Package, ShoppingBag, Settings as SettingsIcon, LogOut, Edit3, Eye,
  ChevronRight, ChevronLeft, ChevronDown, User as UserIcon, Users, Tag, Bell, Box, Globe, Store,
  Download, Headphones, BadgeCheck, ShieldCheck, Zap, History, LogIn, AlertCircle,
  ArrowRight, ArrowLeft, LayoutGrid, MapPin, Phone, Facebook, Youtube, Instagram, Send,
  Lock, Key,
} from 'lucide-react';
import { STR, type Lang } from './i18n';
import {
  load, save, tk, slugify, uid, nowStr, eff, offPct, waLink, IMG,
  SEED_SETTINGS, SEED_CATS, SEED_PRODUCTS, SEED_USERS, SEED_ORDERS, SEED_PURCHASES,
  type User, type Category, type Product, type Review, type Order, type Purchase, type Payment, type Settings, type CartLine, type View,
} from './store';
import { db, auth, loginWithGoogle, loginWithEmail, registerWithEmail, resetPassword, logoutFirebase, firebaseEnabled, compressImageForFirestore, authProviderOf } from './store/firebase';
import { collection, doc, setDoc, onSnapshot, getDoc, deleteDoc, writeBatch, deleteField, query, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const BROWN = '#5a2e0d';
const BROWN_D = '#3d1e07';

function Logo() {
  return (
    <div className="brand-lockup flex items-center gap-2 min-w-0" aria-label="Murad Graphics">
      <img src="/murad-logo-icon.svg" alt="Murad Graphics" className="brand-logo-icon w-10 h-10 md:w-11 md:h-11 shrink-0 object-contain" />
      <div className="brand-wordmark flex md:hidden flex-col items-start leading-none text-white">
        <div className="font-display font-extrabold text-sm">Murad <span className="text-cyan-300">Graphics</span></div>
        <div className="mt-1 text-[7px] tracking-[.28em] text-cyan-100/80">DIGITAL STORE</div>
      </div>
    </div>
  );
}

function WhatsAppLogo({ size = 26 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.1-.471-.149-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.1-.198.05-.372-.025-.521-.075-.149-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.075c.149.198 2.095 3.2 5.076 4.487.71.306 1.263.489 1.694.626.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982 1-3.648-.235-.374a9.866 9.866 0 01-1.511-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.886 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.89c0 2.096.547 4.142 1.588 5.945L.057 24l6.304-1.654a11.88 11.88 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.471-8.413" />
    </svg>
  );
}

const payBadge = (s: string) => s === 'Paid' ? 'bg-emerald-100 text-emerald-700' : s === 'Failed' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700';

export default function App() {
  const [lang, setLang] = useState<Lang>(() => load('ks_lang', 'bn' as Lang));
  const [users, setUsers] = useState<User[]>(() => load<Array<User & { pass?: string }>>('ks_users_v2', SEED_USERS).map(({ pass: _legacyPassword, ...user }) => user));
  const [categories, setCategories] = useState<Category[]>(() => load('ks_cats_v2', SEED_CATS));
  const [products, setProducts] = useState<Product[]>(() => load('ks_products_v2', SEED_PRODUCTS));
  const [orders, setOrders] = useState<Order[]>(() => load('ks_orders_v2', SEED_ORDERS));
  const [purchases, setPurchases] = useState<Purchase[]>(() => load('ks_purchases_v2', SEED_PURCHASES));
  const [cloudReviews, setCloudReviews] = useState<Record<string, Review[]>>({});
  const [payments, setPayments] = useState<Payment[]>(() => load('ks_payments_v2', [] as Payment[]));
  const [settings, setSettings] = useState<Settings>(() => load('ks_settings_v2', SEED_SETTINGS));
  const [cart, setCart] = useState<CartLine[]>(() => load('ks_cart_v1', [] as CartLine[]));
  const [sessionId, setSessionId] = useState<string | null>(() => localStorage.getItem('ks_session_v1') || sessionStorage.getItem('ks_session_v1'));

  const [view, setView] = useState<View>(() => window.location.pathname === '/products' ? 'products' : window.location.pathname.startsWith('/product/') ? 'details' : 'home');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('popular');
  const [slide, setSlide] = useState(0);
  const [gal, setGal] = useState(0);
  const [tab, setTab] = useState<'desc' | 'rev'>('desc');
  const [authOpen, setAuthOpen] = useState<'login' | 'register' | null>(null);
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authErr, setAuthErr] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
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
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'product' | 'category'; id: string; name: string } | null>(null);
  const [couponDraft, setCouponDraft] = useState<string>(() => Object.entries(load('ks_settings_v2', SEED_SETTINGS).coupons || {}).map(([k, v]) => `${k}=${v}`).join(', '));
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [passUpdating, setPassUpdating] = useState(false);
  const [passMsg, setPassMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const t = STR[lang];

  // Live sync with Firebase Firestore if available, otherwise localStorage fallback
  useEffect(() => {
    if (!firebaseEnabled || !db) return;

    // Listen to users
    const unsubUsers = onSnapshot(collection(db, 'users'), snap => {
      const cloudUsers: User[] = [];
      snap.forEach(d => cloudUsers.push(d.data() as User));
      if (cloudUsers.length > 0) {
        setUsers(prev => {
          const map = new Map<string, User>();
          prev.forEach(u => map.set(u.id, u));
          cloudUsers.forEach(u => map.set(u.id, u));
          return Array.from(map.values());
        });
      }
    }, (err) => {
      console.warn('Users listener:', err.message);
    });

    // Listen to categories
    const unsubCats = onSnapshot(collection(db, 'categories'), snap => {
      if (!snap.empty) {
        const cloudCats: Category[] = [];
        snap.forEach(d => cloudCats.push(d.data() as Category));
        setCategories(cloudCats);
      }
    }, (err) => {
      console.warn('Categories listener:', err.message);
    });

    // Listen to products
    const unsubProducts = onSnapshot(collection(db, 'products'), snap => {
      if (!snap.empty) {
        const cloudProds: Product[] = [];
        snap.forEach(d => cloudProds.push(d.data() as Product));
        setProducts(cloudProds);
      }
    }, (err) => {
      console.warn('Products listener:', err.message);
    });

    // Free-plan image fallback: preview images live in separate public docs so
    // product documents stay small and no Storage bucket is required.
    const unsubProductImages = onSnapshot(collection(db, 'productImages'), snap => {
      const images: Record<string, string[]> = {};
      snap.forEach(d => {
        const data = d.data() as { productId?: string; previewImages?: string[] };
        if (data.productId && Array.isArray(data.previewImages)) images[data.productId] = data.previewImages.filter(Boolean);
      });
      setProducts(prev => prev.map(p => images[p.id]?.length ? { ...p, previewImages: images[p.id] } : p));
    }, (err) => {
      console.warn('Product image listener:', err.message);
    });

    // Reviews are stored separately so customers can submit them without
    // gaining write access to the product catalog.
    const unsubReviews = onSnapshot(collection(db, 'reviews'), snap => {
      const grouped: Record<string, Review[]> = {};
      snap.forEach(d => {
        const review = d.data() as Review;
        if (!review.productId || review.rating < 1 || review.rating > 5) return;
        (grouped[review.productId] ||= []).push(review);
      });
      setCloudReviews(grouped);
      if (!snap.empty) {
        setProducts(prev => prev.map(p => {
          const reviews = grouped[p.id] || [];
          return reviews.length ? { ...p, reviews, rating: Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)) } : p;
        }));
      }
    }, (err) => {
      console.warn('Reviews listener:', err.message);
    });

    // Customer reads must be scoped to their own uid. A collection-wide query
    // violates the Firestore rules because it could include another customer's data.
    let unsubOrders = () => {};
    let unsubPurchases = () => {};
    const subscribeOrderData = (uid: string, isAdmin: boolean) => {
      unsubOrders();
      unsubPurchases();
      const orderSource = isAdmin ? collection(db, 'orders') : query(collection(db, 'orders'), where('userId', '==', uid));
      const purchaseSource = isAdmin ? collection(db, 'purchases') : query(collection(db, 'purchases'), where('userId', '==', uid));
      unsubOrders = onSnapshot(orderSource, snap => {
        const cloudOrders: Order[] = [];
        snap.forEach(d => cloudOrders.push(d.data() as Order));
        // The authorized Firestore snapshot is the source of truth. Replacing
        // local cached orders prevents an old Pending value from reappearing.
        setOrders(cloudOrders);
      }, (err) => {
        console.warn('Orders listener:', err.message);
      });
      unsubPurchases = onSnapshot(purchaseSource, snap => {
        const cloudPurchases: Purchase[] = [];
        snap.forEach(d => cloudPurchases.push(d.data() as Purchase));
        setPurchases(cloudPurchases);
      }, (err) => {
        console.warn('Purchases listener:', err.message);
      });
    };

    // Listen to settings
    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), snap => {
      if (snap.exists()) {
        const cloudSettings = snap.data() as Settings;
        if (cloudSettings) {
          setSettings(prev => ({ ...prev, ...cloudSettings }));
        }
      }
    }, (err) => {
      console.warn('Settings listener:', err.message);
    });

    // Auth state changed listener
    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const isAdminUser = !!db && (await getDoc(doc(db, 'admins', fbUser.uid))).exists();
        const role = isAdminUser ? 'admin' : 'customer';
        subscribeOrderData(fbUser.uid, isAdminUser);
        const userDoc: User = {
          id: fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
          email: fbUser.email || '',
          role,
          photoURL: fbUser.photoURL || undefined,
          authProvider: authProviderOf(fbUser),
          createdAt: nowStr(),
        };

        // sync user to firestore
        try {
          if (db) {
            await setDoc(doc(db, 'users', fbUser.uid), { ...userDoc, pass: deleteField() }, { merge: true });
          }
        } catch {
          await logoutFirebase().catch(() => {});
          localStorage.removeItem('ks_session_v1');
          sessionStorage.removeItem('ks_session_v1');
          setSessionId(null);
          setAuthErr(lang === 'bn' ? 'Firebase-এ profile save করা যায়নি। আবার চেষ্টা করুন।' : 'Could not save your Firebase profile. Please try again.');
          return;
        }

        setUsers(prev => {
          const filtered = prev.filter(u => u.id !== fbUser.uid);
          return [userDoc, ...filtered];
        });
        localStorage.setItem('ks_session_v1', fbUser.uid);
        sessionStorage.setItem('ks_session_v1', fbUser.uid);
        setSessionId(fbUser.uid);
      } else {
        unsubOrders();
        unsubPurchases();
        localStorage.removeItem('ks_session_v1');
        sessionStorage.removeItem('ks_session_v1');
        setSessionId(null);
      }
    });

    return () => {
      unsubUsers();
      unsubCats();
      unsubProducts();
      unsubProductImages();
      unsubReviews();
      unsubOrders();
      unsubPurchases();
      unsubSettings();
      unsubAuth();
    };
  }, []);

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
    const syncUrl = () => {
      const match = window.location.pathname.match(/^\/product\/([^/]+)/);
      if (match) {
        const found = products.find(p => p.slug === decodeURIComponent(match[1]));
        if (found) { setDetailId(found.id); setView('details'); }
      } else if (window.location.pathname === '/products') { setDetailId(null); setView('products'); }
      else if (window.location.pathname === '/') { setDetailId(null); setView('home'); }
      else { setDetailId(null); setView('home'); }
    };
    syncUrl();
    window.addEventListener('popstate', syncUrl);
    return () => window.removeEventListener('popstate', syncUrl);
  }, [products]);
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
  // The original demo catalog started in localStorage. Once Firebase has a
  // product document, the listener replaces the local catalog, so migrate the
  // existing local/demo catalog once before treating Firestore as canonical.
  useEffect(() => {
    if (!firebaseEnabled || !db || !me || me.role !== 'admin' || localStorage.getItem('ks_products_seeded_v1') || products.length === 0) return;
    let cancelled = false;
    const migrateProducts = async () => {
      try {
        const batch = writeBatch(db);
        products.forEach(product => batch.set(doc(db, 'products', product.id), product, { merge: true }));
        await batch.commit();
        if (!cancelled) localStorage.setItem('ks_products_seeded_v1', '1');
      } catch (error) {
        console.warn('Product catalog migration failed:', error);
      }
    };
    void migrateProducts();
    return () => { cancelled = true; };
  }, [me?.id, me?.role]);
  useEffect(() => {
    const title = detail ? `${detail.name} | Murad Graphics` : 'Murad Graphics — Digital Products Store Bangladesh';
    const description = detail ? `${detail.description} Buy from Murad Graphics with secure bKash, Nagad or Rocket payment. Current price ${tk(eff(detail))}.` : 'Buy premium digital products, themes, software, bundles and subscriptions from Murad Graphics in Bangladesh. Secure payment and verified delivery.';
    document.title = title;
    const setMeta = (selector: string, attr: 'name' | 'property', key: string, content: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(selector);
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };
    setMeta('meta[name="description"]', 'name', 'description', description);
    setMeta('meta[property="og:title"]', 'property', 'og:title', title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    setMeta('meta[property="og:type"]', 'property', 'og:type', detail ? 'product' : 'website');
    setMeta('meta[property="og:url"]', 'property', 'og:url', window.location.href);
    setMeta('meta[property="og:image"]', 'property', 'og:image', detail?.previewImages[0] || `${window.location.origin}/og-image.png`);
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
    canonical.href = detail ? `${window.location.origin}/product/${detail.slug}` : `${window.location.origin}/`;
    let schema = document.head.querySelector<HTMLScriptElement>('script[data-product-schema]');
    if (detail) {
      if (!schema) { schema = document.createElement('script'); schema.type = 'application/ld+json'; schema.dataset.productSchema = 'true'; document.head.appendChild(schema); }
      schema.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Product', name: detail.name, description: detail.description, image: detail.previewImages, sku: detail.id, brand: { '@type': 'Brand', name: 'Murad Graphics' }, offers: { '@type': 'Offer', url: `${window.location.origin}/product/${detail.slug}`, priceCurrency: 'BDT', price: eff(detail), availability: 'https://schema.org/InStock', seller: { '@type': 'Organization', name: 'Murad Graphics' } }, aggregateRating: detail.reviews.length ? { '@type': 'AggregateRating', ratingValue: detail.rating, reviewCount: detail.reviews.length } : undefined });
    } else if (schema) schema.remove();
  }, [detail]);
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
  const goDetails = (id: string) => { const product = products.find(p => p.id === id); if (!product) return; window.history.pushState({}, '', `/product/${product.slug}`); setDetailId(id); setView('details'); };

  // ---------- auth ----------
  const handleGoogleAuth = async () => {
    setAuthErr('');
    setAuthLoading(true);
    try {
      const fbUser = await loginWithGoogle();
      if (!fbUser) throw new Error('No user returned from Google sign-in');

      const userEmail = (fbUser.email || '').toLowerCase();
      const isAdminUser = !!db && (await getDoc(doc(db, 'admins', fbUser.uid))).exists();
      const role = isAdminUser ? 'admin' : 'customer';
      const u: User = {
        id: fbUser.uid,
        name: fbUser.displayName || (userEmail ? userEmail.split('@')[0] : 'Google User'),
        email: fbUser.email || '',
        role,
        photoURL: fbUser.photoURL || undefined,
        authProvider: authProviderOf(fbUser),
        createdAt: nowStr(),
      };

      // Persist the authenticated profile before completing the login flow.
      // This prevents a successful-looking login when Firestore is unavailable
      // or its security rules reject the write.
      if (!db) throw new Error('Firebase Firestore is not configured.');
      await setDoc(doc(db, 'users', fbUser.uid), { ...u, pass: deleteField() }, { merge: true });
      setUsers(prev => [u, ...prev.filter(x => x.id !== u.id)]);
      localStorage.setItem('ks_session_v1', u.id);
      sessionStorage.setItem('ks_session_v1', u.id);
      setSessionId(u.id);
      setAuthOpen(null);
      notify('✓ ' + (lang === 'bn' ? 'গুগল দিয়ে প্রবেশ সফল হয়েছে: ' : 'Google Sign-in successful: ') + u.name);
      consumePendingBuy(u.id);
      if (role === 'admin' && !pendingBuy) setView('admin');
    } catch (e: unknown) {
      const errObj = e as { code?: string; message?: string };
      const code = errObj?.code || '';
      let msg = errObj?.message || 'Google authentication failed';

      if (code === 'auth/popup-closed-by-user') {
        msg = lang === 'bn' ? 'লগইন পপ-আপটি বন্ধ করা হয়েছে।' : 'Sign-in window was closed.';
      } else if (code === 'auth/cancelled-popup-request') {
        msg = lang === 'bn' ? 'আগের সাইন-ইন রিকোয়েস্ট বাতিল করা হয়েছে।' : 'Previous popup request was cancelled.';
      } else if (code === 'auth/popup-blocked') {
        msg = lang === 'bn' ? 'ব্রাউজার পপ-আপ ব্লক করেছে। পপ-আপ অ্যালাউ করুন বা ইমেইল দিয়ে লগইন করুন।' : 'Popup blocked by browser. Please allow popups or use email/password.';
      } else if (code === 'auth/network-request-failed') {
        msg = lang === 'bn' ? 'নেটওয়ার্ক সমস্যা। ইন্টারনেট কানেকশন চেক করুন।' : 'Network error. Please check your internet connection.';
      } else if (code === 'auth/unauthorized-domain') {
        msg = lang === 'bn' ? 'অননুমোদিত ডোমেন। Firebase Console-এ Auth ডোমেন যোগ করুন।' : 'Unauthorized domain in Firebase Auth settings.';
      } else if (code === 'permission-denied' || code === 'failed-precondition') {
        msg = lang === 'bn' ? 'Firebase-এ user profile save করা যায়নি। Firestore database ও rules পরীক্ষা করুন।' : 'Could not save your profile to Firebase. Please check Firestore database and rules.';
      }
      setAuthErr(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  const doRegister = async () => {
    setAuthErr('');
    try {
      if (!authForm.name.trim() || !authForm.email.trim() || !authForm.password) throw new Error(lang === 'bn' ? 'নাম, ইমেইল ও পাসওয়ার্ড দিন।' : 'Name, email and password required.');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(authForm.email)) throw new Error(lang === 'bn' ? 'সঠিক ইমেইল দিন।' : 'Enter a valid email.');
      if (authForm.password.length < 6) throw new Error(lang === 'bn' ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' : 'Password must be at least 6 characters.');
      if (!firebaseEnabled) throw new Error('Firebase Authentication is not configured.');
      const fbUser = await registerWithEmail(authForm.email.trim(), authForm.password, authForm.name);
      setAuthOpen(null);
      notify('✓ ' + (fbUser.displayName || fbUser.email || 'Account created'));
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      setAuthErr(code === 'auth/email-already-in-use' ? (lang === 'bn' ? 'এই ইমেইলে account আছে — Login করুন।' : 'Account exists — please login.') : e instanceof Error ? e.message : 'Registration failed');
    }
  };
  const doLogin = async () => {
    setAuthErr('');
    try {
      if (!firebaseEnabled) throw new Error('Firebase Authentication is not configured.');
      const fbUser = await loginWithEmail(authForm.email.trim(), authForm.password);
      setAuthOpen(null);
      notify('✓ ' + (fbUser.displayName || fbUser.email || 'Login successful'));
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      setAuthErr(code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password' ? (lang === 'bn' ? 'ভুল ইমেইল/পাসওয়ার্ড।' : 'Wrong email or password.') : e instanceof Error ? e.message : 'Login failed');
    }
  };
  const logout = async () => {
    try { await logoutFirebase(); } catch { /* ignore */ }
    localStorage.removeItem('ks_session_v1');
    sessionStorage.removeItem('ks_session_v1');
    setSessionId(null);
    setAcctMenu(false);
    setView('home');
  };

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
  const placeOrder = async () => {
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
      const paymentItem = { id: uid('pay'), orderId: oid, userId: me.id, amount: total, transactionId: trxId.trim(), method: payMethod, status: 'Pending' as const, createdAt: nowStr() };
      if (!db) throw new Error('Firebase Firestore is not configured. Order was not submitted.');
      const batch = writeBatch(db);
      batch.set(doc(db, 'orders', oid), order);
      batch.set(doc(db, 'payments', paymentItem.id), paymentItem);
      await batch.commit();
      setOrders([order, ...orders]);
      setPayments([paymentItem, ...payments]);
      setOrderPlaced(order); setCart([]); setAppliedCoupon(''); setCouponInput(''); setTrxId('');
    } catch (e: unknown) { fail(e instanceof Error ? e.message : 'Failed'); }
  };

  const verifyPayment = async (orderId: string, ok: boolean) => {
    const o = orders.find(x => x.id === orderId); if (!o) return;
    const st = ok ? 'Paid' : 'Failed';
    const updatedStatus = ok ? 'Completed' : 'Payment Failed';
    try {
      if (!db) throw new Error('Firebase Firestore is not configured.');
      const batch = writeBatch(db);
      batch.update(doc(db, 'orders', orderId), { paymentStatus: st, orderStatus: updatedStatus });
      const fresh: Purchase[] = [];
      if (ok) {
        o.items.forEach(it => {
          if (!purchases.some(p => p.userId === o.userId && p.productId === it.productId && p.accessStatus === 'active')) {
            const pu: Purchase = { id: `${o.userId}_${it.productId}`, userId: o.userId, productId: it.productId, orderId, accessStatus: 'active', purchasedAt: nowStr() };
            fresh.push(pu);
            batch.set(doc(db, 'purchases', pu.id), pu);
          }
        });
      }
      await batch.commit();
      setOrders(orders.map(x => x.id === orderId ? { ...x, paymentStatus: st as Order['paymentStatus'], orderStatus: updatedStatus as Order['orderStatus'] } : x));
      setPayments(payments.map(p => p.orderId === orderId ? { ...p, status: st as Payment['status'] } : p));
      if (ok) {
        setPurchases([...fresh, ...purchases]);
        setProducts(products.map(p => o.items.some(i => i.productId === p.id) ? { ...p, sold: p.sold + 1 } : p));
        notify('✓ ' + t.saved);
      } else fail(t.failed);
    } catch (e: unknown) {
      fail(e instanceof Error ? e.message : 'Could not update payment.');
    }
  };

  const openAccess = (uid_: string | null, pid: string) => {
    const prod = products.find(p => p.id === pid);
    if (!uid_) { fail(t.pleaseLogin); return; }
    if (!owns(uid_, pid)) { fail(t.accessDenied); return; }
    if (!prod?.googleDriveLink) { fail(t.noAccessLink); return; }
    window.open(prod.googleDriveLink, '_blank');
  };

  const addReview = async () => {
    if (!me) { fail(t.pleaseLogin); return; }
    if (!revName.trim() || !revText.trim() || !detail) { fail(t.fillReview); return; }
    if (!owns(me.id, detail.id)) { fail(lang === 'bn' ? 'শুধু কেনা পণ্যের verified buyer rating দিতে পারবেন।' : 'Only verified buyers can review this product.'); return; }
    const existing = (cloudReviews[detail.id] || detail.reviews || []).find(r => r.userId === me.id);
    if (existing) { fail(lang === 'bn' ? 'এই পণ্যে আপনার rating আগে থেকেই দেওয়া আছে।' : 'You have already rated this product.'); return; }
    const purchaseId = `${me.id}_${detail.id}`;
    const review: Review = { id: `${detail.id}_${me.id}`, productId: detail.id, userId: me.id, purchaseId, name: revName.trim(), rating: Math.min(5, Math.max(1, revStars)), text: revText.trim(), date: nowStr(), verified: true };
    try {
      if (!db) throw new Error('Firebase Firestore is not configured.');
      await setDoc(doc(db, 'reviews', review.id || `${detail.id}_${me.id}`), review);
      const nextReviews = [...(cloudReviews[detail.id] || detail.reviews || []), review];
      const nextRating = Number((nextReviews.reduce((sum, r) => sum + r.rating, 0) / nextReviews.length).toFixed(1));
      setCloudReviews(prev => ({ ...prev, [detail.id]: nextReviews }));
      setProducts(prev => prev.map(p => p.id === detail.id ? { ...p, reviews: nextReviews, rating: nextRating } : p));
      setRevName(''); setRevText(''); setRevStars(5); notify('✓ ' + t.reviewAdded);
    } catch (e: unknown) {
      fail(e instanceof Error ? e.message : (lang === 'bn' ? 'Rating save হয়নি। আবার চেষ্টা করুন।' : 'Could not save rating. Please try again.'));
    }
  };

  const handleFiles = async (files: FileList | null, isCat: boolean) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const selectedFiles = Array.from(files).slice(0, isCat ? 1 : 5);
      for (const f of selectedFiles) {
        if (!f.type.startsWith('image/')) throw new Error('শুধু image file আপলোড করুন।');
        if (f.size > 5 * 1024 * 1024) throw new Error('প্রতিটি image 5 MB-এর কম হতে হবে।');
        const ownerId = isCat ? editingCat?.id : editing?.id;
        if (!ownerId) throw new Error('Please select an item before uploading an image.');
        if (!isCat && (editing?.previewImages.filter(Boolean).length || 0) >= 5) throw new Error('সর্বোচ্চ ৫টি preview image দেওয়া যাবে।');
        const d = await compressImageForFirestore(f);
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
    finally { setUploading(false); }
  };

  const payNumbers: [string, string, string][] = [['bKash', settings.bkash, '#e2136e'], ['Nagad', settings.nagad, '#f6921e'], ['Rocket', settings.rocket, '#8c3494'], ['Binance', settings.binance, '#111827']];

  // ---------- kholos-style card ----------
  const ProductCard = ({ p }: { p: Product }) => {
    const owned = owns(sessionId, p.id);
    return (
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 overflow-hidden card-hover flex flex-col shadow-xs hover:shadow-md transition">
        <div className="relative cursor-pointer img-zoom group" onClick={() => goDetails(p.id)}>
          <img src={p.previewImages[0] || IMG(p.id)} alt={p.name} loading="lazy" className="w-full h-36 sm:h-48 md:h-60 object-cover" onError={e => { const im = e.target as HTMLImageElement; im.onerror = null; im.src = IMG(p.id); }} />
          {offPct(p) > 0 && <span className="absolute bottom-2 left-2 text-white text-[9px] sm:text-[11px] font-black px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full flex items-center gap-0.5 sm:gap-1 shadow" style={{ background: BROWN }}><Zap size={10} className="fill-orange-400 text-orange-400" />{offPct(p)}% {t.off}</span>}
          {owned
            ? <span className="absolute top-2 left-2 bg-emerald-500 text-white text-[9px] sm:text-[10px] font-black px-2 py-0.5 sm:py-1 rounded-full flex items-center gap-1 shadow"><Check size={10} />{t.ownedBadge}</span>
            : <span className="absolute top-2 left-2 text-white text-[9px] sm:text-[10px] font-black px-2 py-0.5 sm:py-1 rounded-full shadow" style={{ background: BROWN }}>{t.digitalTag}</span>}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition hidden sm:flex items-end justify-center gap-2 pb-4">
            {owned
              ? <button onClick={e => { e.stopPropagation(); openAccess(sessionId, p.id); }} className="bg-emerald-500 text-white text-xs font-black px-4 py-2 rounded-full flex items-center gap-1.5 shadow-xl cursor-pointer"><Download size={13} />{t.download}</button>
              : <><button onClick={e => { e.stopPropagation(); goDetails(p.id); }} className="bg-white text-slate-800 text-xs font-black px-4 py-2 rounded-full shadow-xl hover:bg-orange-50 cursor-pointer">{t.buyNow}</button>
                <button onClick={e => { e.stopPropagation(); addCart(p.id); }} className="bg-white/20 backdrop-blur border border-white/40 text-white w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/30 cursor-pointer" title={t.addToCart}><ShoppingCart size={15} /></button></>}
          </div>
        </div>
        <div className="p-2.5 sm:p-3.5 flex flex-col flex-1">
          <h3 className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug line-clamp-2 min-h-[2.4em] cursor-pointer hover:text-[#7c2d12]"><a href={`/product/${p.slug}`} onClick={e => { e.preventDefault(); goDetails(p.id); }}>{p.name}</a></h3>
          <div className="flex items-center gap-1 mt-1 text-[10px] sm:text-[11px] text-slate-400"><Star size={11} className="fill-amber-400 text-amber-400" />{p.rating} <span>({p.sold.toLocaleString()})</span></div>
          <div className="border-t border-slate-100 mt-2 pt-2 flex items-end justify-between gap-1">
            <div className="min-w-0 flex-1">
              <div className="font-display font-black text-base sm:text-lg md:text-xl truncate" style={{ color: BROWN }}>{tk(eff(p))}</div>
              <div className="flex items-center gap-1 flex-wrap">
                {offPct(p) > 0 && <s className="text-[10px] sm:text-xs text-slate-400">{tk(p.price)}</s>}
                {offPct(p) > 0 && <span className="text-[9px] sm:text-[10px] font-bold text-rose-500 bg-rose-50 px-1 py-0.5 rounded">-{offPct(p)}%</span>}
              </div>
            </div>
            {owned
              ? <button onClick={() => openAccess(sessionId, p.id)} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition shrink-0 cursor-pointer" title={t.download}><Download size={15} /></button>
              : <button onClick={() => addCart(p.id)} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:border-[#5a2e0d] hover:text-[#5a2e0d] hover:bg-orange-50 transition shrink-0 cursor-pointer" title={t.addToCart}><ShoppingCart size={15} /></button>}
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
          <p className="text-xs text-slate-500 mt-1">{lang === 'bn' ? 'শুধুমাত্র অনুমোদিত অ্যাডমিন এই প্যানেল দেখতে পারবেন।' : 'Only authorized administrators can access this panel.'}</p>
          <div className="grid gap-2 mt-4">
            <button onClick={() => { setView('home'); setAuthOpen('login'); }} className="text-white font-bold py-3 rounded-2xl text-sm cursor-pointer" style={{ background: BROWN }}>Admin Login</button>
            <button onClick={() => setView('home')} className="bg-slate-100 hover:bg-slate-200 font-bold py-3 rounded-2xl text-sm cursor-pointer">{t.home}</button>
          </div>
        </div>
      </div>
    );
    const pendPay = payments.filter(p => p.status === 'Pending');

    const confirmDeleteProduct = (id: string, name: string) => {
      setDeleteConfirm({ type: 'product', id, name });
    };

    const confirmDeleteCategory = (id: string, name: string) => {
      if (products.some(p => p.categoryId === id)) {
        fail(lang === 'bn' ? 'এই ক্যাটাগরিতে প্রোডাক্ট রয়েছে। আগে প্রোডাক্ট মুছুন বা ক্যাটাগরি বদলান।' : 'Category has products. Remove or reassign them first.');
        return;
      }
      setDeleteConfirm({ type: 'category', id, name });
    };

    const executeDelete = async () => {
      if (!deleteConfirm) return;
      const { type, id, name } = deleteConfirm;
      if (type === 'product') {
        setProducts(prev => prev.filter(x => x.id !== id));
        if (db) {
          try {
            await deleteDoc(doc(db, 'products', id));
          } catch {
            // fallback
          }
        }
        notify(`✓ "${name}" ` + (lang === 'bn' ? 'মুছে ফেলা হয়েছে' : 'deleted'));
      } else if (type === 'category') {
        setCategories(prev => prev.filter(x => x.id !== id));
        if (db) {
          try {
            await deleteDoc(doc(db, 'categories', id));
          } catch {
            // fallback
          }
        }
        notify(`✓ "${name}" ` + (lang === 'bn' ? 'মুছে ফেলা হয়েছে' : 'deleted'));
      }
      setDeleteConfirm(null);
    };

    const handleSaveProduct = async () => {
      if (!editing) return;
      if (!editing.name.trim()) { fail(lang === 'bn' ? 'প্রোডাক্টের নাম দিন' : 'Name required'); return; }
      if (!editing.googleDriveLink.trim()) { fail(lang === 'bn' ? 'Google Drive link আবশ্যক' : 'Google Drive link required'); return; }
    const updated = products.find(x => x.id === editing.id)
      ? products.map(x => x.id === editing.id ? editing : x)
      : [...products, editing];
      if (db) {
        try {
          // Persist the catalog without embedding large data URLs in product
          // docs; preview images are stored in separate free-plan documents.
          const batch = writeBatch(db);
          updated.forEach(product => {
            const hasDataImages = product.previewImages.some(src => src.startsWith('data:'));
            const productForCloud = hasDataImages ? { ...product, previewImages: [] } : product;
            batch.set(doc(db, 'products', product.id), productForCloud, { merge: true });
            if (hasDataImages) batch.set(doc(db, 'productImages', product.id), { productId: product.id, previewImages: product.previewImages }, { merge: true });
          });
          await batch.commit();
          localStorage.setItem('ks_products_seeded_v1', '1');
        } catch (e: unknown) {
          fail(e instanceof Error ? e.message : (lang === 'bn' ? 'Product save হয়নি। Firebase rules পরীক্ষা করুন।' : 'Could not save product. Check Firebase rules.'));
          return;
        }
      }
      setProducts(updated);
      setEditing(null);
      notify('✓ ' + t.saved);
    };

    const handleSaveCategory = async () => {
      if (!editingCat) return;
      if (!editingCat.name.trim()) { fail(lang === 'bn' ? 'ক্যাটাগরির নাম দিন' : 'Name required'); return; }
      const updated = categories.find(x => x.id === editingCat.id)
        ? categories.map(x => x.id === editingCat.id ? editingCat : x)
        : [...categories, editingCat];
      setCategories(updated);
      if (db) {
        try {
          await setDoc(doc(db, 'categories', editingCat.id), editingCat, { merge: true });
        } catch {
          // fallback
        }
      }
      setEditingCat(null);
      notify('✓ ' + t.saved);
    };

    const handlePromoImageUpload = async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setUploading(true);
    try {
        const d = await compressImageForFirestore(files[0]);
        setSettings(prev => ({ ...prev, promoImage: d }));
        notify('✓ ' + (lang === 'bn' ? 'ব্যানার ইমেজ আপলোড হয়েছে' : 'Banner image uploaded'));
      } catch (e: unknown) {
        fail(e instanceof Error ? e.message : 'Banner upload failed');
      }
      setUploading(false);
    };

    const handleSaveSettings = async () => {
      setSettingsSaving(true);
      setSettingsSuccess(false);

      // Parse coupon draft into record
      const parsedCoupons: Record<string, string> = {};
      if (couponDraft.trim()) {
        couponDraft.split(',').forEach(s => {
          const parts = s.split('=');
          if (parts.length >= 2) {
            const k = parts[0]?.trim().toUpperCase();
            const v = parts.slice(1).join('=').trim();
            if (k && v) parsedCoupons[k] = v;
          }
        });
      }

      const updatedSettings: Settings = {
        ...settings,
        coupons: parsedCoupons,
      };

      setSettings(updatedSettings);
      save('ks_settings_v2', updatedSettings);

      if (db) {
        try {
          await setDoc(doc(db, 'settings', 'global'), updatedSettings, { merge: true });
        } catch (error) {
          console.warn('Firestore settings save error:', error);
        }
      }

      setSettingsSaving(false);
      setSettingsSuccess(true);
      notify('✓ ' + (lang === 'bn' ? 'সেটিংস সফলভাবে সংরক্ষিত ও সিঙ্ক হয়েছে' : 'Settings saved & synced successfully'));
      setTimeout(() => setSettingsSuccess(false), 4000);
    };

    const handleUpdateAdminPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      setPassMsg(null);
      if (!me) return;
      setPassUpdating(true);
      try {
        await resetPassword(me.email);
        setPassMsg({ type: 'ok', text: lang === 'bn' ? '✓ পাসওয়ার্ড reset link ইমেইলে পাঠানো হয়েছে।' : '✓ Password reset link sent to your email.' });
      } catch (err: unknown) {
        setPassMsg({ type: 'err', text: err instanceof Error ? err.message : 'পাসওয়ার্ড পরিবর্তন করতে সমস্যা হয়েছে' });
      } finally {
        setPassUpdating(false);
      }
    };

    return (
      <div className="min-h-screen bg-slate-100 pb-12 w-full max-w-full overflow-x-hidden">
        <header className="text-white px-3 sm:px-4 py-3 flex items-center gap-2 sm:gap-3 sticky top-0 z-20 shadow-md w-full max-w-full" style={{ background: BROWN_D }}>
          <Logo />
          <div className="flex-1 min-w-0"><div className="font-bold text-sm sm:text-base truncate">Admin Dashboard</div><div className="text-[11px] text-orange-200/70 truncate hidden sm:block">{me.name}</div></div>
          <button onClick={() => setView('home')} className="shrink-0 text-xs bg-white/10 hover:bg-white/20 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg flex items-center gap-1 cursor-pointer transition"><Eye size={13} /> <span className="hidden sm:inline">Store</span></button>
          <button onClick={logout} className="shrink-0 text-xs bg-rose-500 hover:bg-rose-600 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg flex items-center gap-1 cursor-pointer transition"><LogOut size={13} /> <span className="hidden sm:inline">{t.logout}</span></button>
        </header>
        <div className="max-w-6xl mx-auto p-3 sm:p-4 w-full">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-4">
            {([['overview', 'Overview', LayoutDashboard], ['products', 'Products', Package], ['orders', 'Orders', ShoppingBag], ['customers', 'Customers', Users], ['cats', 'Categories', Tag], ['settings', 'Settings', SettingsIcon]] as [typeof adminTab, string, typeof LayoutDashboard][]).map(([k, l, Icon]) => (
              <button key={k} onClick={() => setAdminTab(k)} className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer transition ${adminTab === k ? 'text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-50'}`} style={adminTab === k ? { background: BROWN } : {}}><Icon size={15} />{l}{k === 'orders' && pendPay.length > 0 && <span className="bg-rose-500 text-white text-[10px] px-1.5 rounded-full">{pendPay.length}</span>}</button>
            ))}
          </div>

          {adminTab === 'overview' && (
            <div className="grid gap-4 w-full">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[[lang === 'bn' ? 'মোট Revenue (Paid)' : 'Revenue (Paid)', tk(revenue)], ['Orders', String(orders.length)], ['Products', String(products.length)], ['Customers', String(users.filter(u => u.role === 'customer').length)]].map(([l, v]) => (
                  <div key={l as string} className="text-white rounded-2xl p-4 min-w-0" style={{ background: `linear-gradient(135deg, ${BROWN}, #8a4a12)` }}><div className="text-xs opacity-80 truncate">{l as string}</div><div className="text-xl sm:text-2xl font-extrabold font-display truncate">{v as string}</div></div>
                ))}
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-xs overflow-hidden">
                <h3 className="font-bold mb-2">⏳ Pending Verification ({pendPay.length})</h3>
                {pendPay.length === 0 ? <p className="text-sm text-slate-500">—</p> : pendPay.map(p => (
                  <div key={p.id} className="border border-slate-200 rounded-xl p-3 mb-2 text-sm flex flex-wrap items-center justify-between gap-2">
                    <div className="flex-1 min-w-[200px]"><span className="font-mono font-bold">{p.orderId}</span><span className="text-slate-500"> • {users.find(u => u.id === p.userId)?.name} • {p.method} • Trx: <b className="font-mono">{p.transactionId}</b> • <b>{tk(p.amount)}</b></span></div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => verifyPayment(p.orderId, true)} className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-lg cursor-pointer">✓ Verify & Grant</button>
                      <button onClick={() => verifyPayment(p.orderId, false)} className="bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold px-3 py-2 rounded-lg cursor-pointer">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-xs overflow-hidden">
                <h3 className="font-bold mb-2">Recent Orders</h3>
                <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-slate-500 text-xs"><th className="p-2">Order</th><th className="p-2">Customer</th><th className="p-2">Total</th><th className="p-2">Payment</th></tr></thead><tbody>
                  {orders.slice(0, 6).map(o => <tr key={o.id} className="border-t"><td className="p-2 font-mono font-bold whitespace-nowrap">{o.id}</td><td className="p-2 truncate max-w-[140px]">{users.find(u => u.id === o.userId)?.name}</td><td className="p-2 font-bold whitespace-nowrap">{tk(o.total)}</td><td className="p-2 whitespace-nowrap"><span className={`text-xs px-2 py-1 rounded-full font-bold ${payBadge(o.paymentStatus)}`}>{o.paymentStatus}</span></td></tr>)}
                </tbody></table></div>
              </div>
            </div>
          )}

          {adminTab === 'products' && (
            <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-xs overflow-hidden">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h3 className="font-bold text-sm sm:text-base">Products ({products.length})</h3>
                <button onClick={() => { setImgUrl(''); setEditing({ id: uid('p'), name: '', slug: '', description: '', price: 500, categoryId: categories[0]?.id || '', previewImages: [], googleDriveLink: '', features: [], reviews: [], status: 'active', rating: 4.8, sold: 0, createdAt: nowStr() }); }} className="text-white text-xs sm:text-sm px-3.5 py-2 rounded-xl flex items-center gap-1 cursor-pointer shrink-0" style={{ background: BROWN }}><Plus size={15} /> New</button>
              </div>
              <div className="grid gap-2">
                {products.map(p => (
                  <div key={p.id} className="flex items-center gap-2 sm:gap-3 border border-slate-200 rounded-xl p-2.5 bg-white hover:bg-slate-50/50 transition">
                    <img src={p.previewImages[0] || IMG(p.id, 200)} alt="" className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover bg-slate-200 shrink-0" onError={e => { const im = e.target as HTMLImageElement; im.onerror = null; im.src = IMG(p.id, 200); }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs sm:text-sm truncate text-slate-800">{p.name}</div>
                      <div className="text-[11px] sm:text-xs text-slate-500 truncate mt-0.5">{catName(p.categoryId)} • {tk(eff(p))} • <span className={p.status === 'active' ? 'text-emerald-600 font-medium' : 'text-slate-400'}>{p.status}</span> • {p.sold} sold</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => { setImgUrl(''); setEditing({ ...p }); }} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer" title="Edit"><Edit3 size={15} /></button>
                      <button onClick={() => confirmDeleteProduct(p.id, p.name)} className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer" title="Delete"><Trash2 size={15} /></button>
                    </div>
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
                              <button onClick={() => setEditing({ ...editing, previewImages: editing.previewImages.filter((_, j) => j !== i) })} className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 cursor-pointer"><X size={11} /></button></div>
                          ) : null)}
                        </div>
                        <label className="block text-center text-xs font-bold px-3 py-2.5 rounded-lg cursor-pointer text-white" style={{ background: BROWN }}>{uploading ? '⏳…' : '📤 Device থেকে Upload'}
                          <input type="file" accept="image/*" multiple className="hidden" disabled={uploading} onChange={e => { handleFiles(e.target.files, false); e.target.value = ''; }} /></label>
                        <div className="flex gap-1.5 mt-1.5">
                          <input className="flex-1 border rounded-lg px-2.5 py-2 text-xs bg-white" placeholder="…or image URL" value={imgUrl} onChange={e => setImgUrl(e.target.value)} />
                          <button onClick={() => { if (!imgUrl.trim()) return; setEditing({ ...editing, previewImages: [...editing.previewImages.filter(Boolean), imgUrl.trim()] }); setImgUrl(''); }} className="text-xs bg-slate-900 text-white px-3 rounded-lg font-bold cursor-pointer">Add</button>
                        </div>
                      </div>
                      <textarea className="border rounded-lg px-3 py-2" rows={2} placeholder="Description" value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })} />
                      <textarea className="border rounded-lg px-3 py-2" rows={2} placeholder="Features (line per item)" value={editing.features.join('\n')} onChange={e => setEditing({ ...editing, features: e.target.value.split('\n').filter(Boolean) })} />
                      <div className="flex gap-2">
                        <button onClick={handleSaveProduct} className="flex-1 text-white py-2.5 rounded-xl font-bold cursor-pointer" style={{ background: BROWN }}>Save</button>
                        <button onClick={() => setEditing(null)} className="px-4 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer">Cancel</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {adminTab === 'orders' && (
            <div className="bg-white rounded-2xl p-4 shadow-xs overflow-hidden">
              <h3 className="font-bold mb-3">Orders ({orders.length}) • {tk(revenue)} (Paid)</h3>
              {orders.length === 0 ? <p className="text-sm text-slate-500">—</p> : orders.map(o => (
                <div key={o.id} className="border border-slate-200 rounded-xl p-3 mb-2 text-sm">
                  <div className="flex items-center justify-between flex-wrap gap-2"><span className="font-mono font-bold">{o.id}</span><span className={`text-xs px-2 py-1 rounded-full font-bold ${payBadge(o.paymentStatus)}`}>{o.paymentStatus}</span></div>
                  <div className="text-slate-600 mt-1">{users.find(u => u.id === o.userId)?.name} • {o.paymentMethod} • Trx: <b className="font-mono">{o.trxId || '—'}</b></div>
                  <div className="text-xs text-slate-500 mt-1">{o.items.map(i => i.name).join(', ')}</div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap justify-between"><span className="font-bold">{tk(o.total)}</span><span className="text-xs text-slate-400">{o.createdAt}</span>
                    {o.paymentStatus === 'Pending' && <div className="flex items-center gap-1.5"><button onClick={() => verifyPayment(o.id, true)} className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-bold cursor-pointer">✓ Verify & Grant</button><button onClick={() => verifyPayment(o.id, false)} className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 rounded-lg font-bold cursor-pointer">Reject</button></div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {adminTab === 'customers' && (
            <div className="bg-white rounded-2xl p-4 shadow-xs overflow-hidden">
              <h3 className="font-bold mb-3">Customers ({users.filter(u => u.role === 'customer').length})</h3>
              {users.filter(u => u.role === 'customer').map(u => {
                const uo = orders.filter(o => o.userId === u.id);
                const up = purchases.filter(p => p.userId === u.id && p.accessStatus === 'active');
                return <div key={u.id} className="border border-slate-200 rounded-xl p-3 mb-2 text-sm">
                  <div className="font-bold flex items-center gap-1.5 truncate"><UserIcon size={14} className="shrink-0" /><span className="truncate">{u.name}</span> <span className="text-xs font-normal text-slate-500 truncate">({u.email})</span></div>
                  <div className="text-xs text-slate-500 mt-1">{u.createdAt} • Orders: {uo.length} • Purchased: {up.length}</div>
                  {up.length > 0 && <div className="text-xs text-emerald-700 mt-1">✓ {up.map(p => products.find(x => x.id === p.productId)?.name).join(', ')}</div>}
                </div>;
              })}
            </div>
          )}

          {adminTab === 'cats' && (
            <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-xs overflow-hidden">
              <div className="flex items-center justify-between mb-3"><h3 className="font-bold text-sm sm:text-base">Categories ({categories.length})</h3>
                <button onClick={() => setEditingCat({ id: uid('c'), name: '', slug: '', image: '', status: 'active' })} className="text-white text-xs sm:text-sm px-3.5 py-2 rounded-xl flex items-center gap-1 cursor-pointer shrink-0" style={{ background: BROWN }}><Plus size={15} /> New</button></div>
              {categories.map(c => (
                <div key={c.id} className="flex items-center gap-2.5 border border-slate-200 rounded-xl p-2.5 mb-2 text-sm bg-white">
                  {c.image ? <img src={c.image} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" /> : <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0"><Tag size={16} className="text-[#7c2d12]" /></div>}
                  <div className="flex-1 min-w-0"><div className="font-semibold text-xs sm:text-sm truncate">{c.name}</div><div className="text-xs text-slate-400 truncate">{products.filter(p => p.categoryId === c.id).length} items • {c.status}</div></div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setEditingCat({ ...c })} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer" title="Edit"><Edit3 size={14} /></button>
                    <button onClick={() => confirmDeleteCategory(c.id, c.name)} className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer" title="Delete"><Trash2 size={14} /></button>
                  </div>
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
                      <div className="flex gap-2">
                        <button onClick={handleSaveCategory} className="flex-1 text-white py-2.5 rounded-xl font-bold cursor-pointer" style={{ background: BROWN }}>Save</button>
                        <button onClick={() => setEditingCat(null)} className="px-4 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer">Cancel</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {adminTab === 'settings' && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 grid gap-6 text-sm max-w-3xl">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">⚙️ {lang === 'bn' ? 'স্টোর সেটিংস ও কনফিগারেশন' : 'Store Settings & Configuration'}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{lang === 'bn' ? 'স্টোরের যাবতীয় তথ্য, পেমেন্ট নম্বর, কুপন এবং ব্যানার আপডেট করুন' : 'Update store details, payment numbers, coupons, and promo banner'}</p>
                </div>
                {settingsSuccess && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full flex items-center gap-1.5 animate-pulse">
                    <Check size={14} /> {lang === 'bn' ? 'সফলভাবে সংরক্ষিত!' : 'Saved Successfully!'}
                  </span>
                )}
              </div>

              {/* WhatsApp Support */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4">
                <label className="font-bold text-emerald-900 flex items-center gap-2 mb-1">
                  <MessageCircle size={18} className="text-emerald-600" />
                  WhatsApp Number * ({lang === 'bn' ? 'সাপোর্ট ও অর্ডারের জন্য' : 'For support & orders'})
                </label>
                <input
                  className="w-full bg-white border border-emerald-300 rounded-xl px-3.5 py-2.5 font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-hidden font-bold"
                  value={settings.whatsapp}
                  onChange={e => setSettings({ ...settings, whatsapp: e.target.value })}
                  placeholder="8801977981796"
                />
                <p className="text-[11px] text-emerald-700 mt-1.5">দেশ কোড সহ দিন (যেমন: 8801977981796)</p>
              </div>

              {/* Store & Announcement */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Store Name</label>
                  <input
                    className="w-full border rounded-xl px-3.5 py-2.5 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#5a2e0d] outline-hidden"
                    value={settings.storeName}
                    onChange={e => setSettings({ ...settings, storeName: e.target.value })}
                    placeholder="Murad Graphics"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Topbar Announcement</label>
                  <input
                    className="w-full border rounded-xl px-3.5 py-2.5 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#5a2e0d] outline-hidden"
                    value={settings.announcement}
                    onChange={e => setSettings({ ...settings, announcement: e.target.value })}
                    placeholder="Welcome to Murad Graphics!"
                  />
                </div>
              </div>

              {/* Payment Numbers */}
              <div className="border rounded-2xl p-4 bg-slate-50/40">
                <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">💳 {lang === 'bn' ? 'পেমেন্ট মেথড নম্বরসমূহ' : 'Payment Methods'}</h4>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#e2136e] block mb-1">bKash Personal / Send Money</label>
                    <input
                      className="w-full border border-pink-200 rounded-xl px-3 py-2 font-mono bg-white"
                      value={settings.bkash}
                      onChange={e => setSettings({ ...settings, bkash: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#f6921e] block mb-1">Nagad Personal / Send Money</label>
                    <input
                      className="w-full border border-orange-200 rounded-xl px-3 py-2 font-mono bg-white"
                      value={settings.nagad}
                      onChange={e => setSettings({ ...settings, nagad: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#8c3494] block mb-1">Rocket Personal</label>
                    <input
                      className="w-full border border-purple-200 rounded-xl px-3 py-2 font-mono bg-white"
                      value={settings.rocket}
                      onChange={e => setSettings({ ...settings, rocket: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">Binance Pay ID</label>
                    <input
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 font-mono bg-white"
                      value={settings.binance}
                      onChange={e => setSettings({ ...settings, binance: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="border rounded-2xl p-4 bg-slate-50/40">
                <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">🌐 {lang === 'bn' ? 'সোশ্যাল মিডিয়া লিংক' : 'Social Links'}</h4>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Facebook Page / Group URL</label>
                    <input
                      className="w-full border rounded-xl px-3 py-2 bg-white text-xs"
                      value={settings.facebook}
                      onChange={e => setSettings({ ...settings, facebook: e.target.value })}
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">YouTube Channel URL</label>
                    <input
                      className="w-full border rounded-xl px-3 py-2 bg-white text-xs"
                      value={settings.youtube}
                      onChange={e => setSettings({ ...settings, youtube: e.target.value })}
                      placeholder="https://youtube.com/..."
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Telegram Channel / Support URL</label>
                    <input
                      className="w-full border rounded-xl px-3 py-2 bg-white text-xs"
                      value={settings.telegram}
                      onChange={e => setSettings({ ...settings, telegram: e.target.value })}
                      placeholder="https://t.me/..."
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Instagram URL</label>
                    <input
                      className="w-full border rounded-xl px-3 py-2 bg-white text-xs"
                      value={settings.instagram}
                      onChange={e => setSettings({ ...settings, instagram: e.target.value })}
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                </div>
              </div>

              {/* Promo Banner & Title */}
              <div className="border rounded-2xl p-4 bg-slate-50/40">
                <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">🎉 {lang === 'bn' ? 'হোমপেজ প্রোমো ব্যানার' : 'Homepage Promo Banner'}</h4>
                <div className="grid gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Promo Title Badge</label>
                    <input
                      className="w-full border rounded-xl px-3.5 py-2.5 bg-white"
                      value={settings.promoTitle}
                      onChange={e => setSettings({ ...settings, promoTitle: e.target.value })}
                      placeholder="MEGA BUNDLE SALE"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Banner Image ({lang === 'bn' ? 'ডিভাইস থেকে আপলোড করুন অথবা লিংক দিন' : 'Upload or Enter URL'})</label>
                    <div className="flex gap-2 flex-wrap items-center">
                      <label className="text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer text-white flex items-center gap-1.5 shadow-xs" style={{ background: BROWN }}>
                        {uploading ? '⏳ Uploading…' : '📤 Upload Banner from Device'}
                        <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={e => { handlePromoImageUpload(e.target.files); e.target.value = ''; }} />
                      </label>
                      <input
                        className="flex-1 min-w-[200px] border rounded-xl px-3 py-2 bg-white text-xs"
                        placeholder="...or paste image URL"
                        value={settings.promoImage.startsWith('data:') ? '' : settings.promoImage}
                        onChange={e => setSettings({ ...settings, promoImage: e.target.value })}
                      />
                    </div>
                  </div>
                  {/* Live Banner Preview */}
                  {settings.promoImage && (
                    <div className="mt-2 rounded-2xl overflow-hidden border border-slate-200 relative max-h-48 bg-slate-900">
                      <img
                        src={settings.promoImage}
                        alt="Promo Preview"
                        className="w-full h-40 object-cover opacity-90"
                        onError={e => { (e.target as HTMLImageElement).src = IMG('mg-promo', 800); }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent p-4 flex flex-col justify-center">
                        <span className="bg-amber-400 text-slate-900 text-[10px] font-black px-2.5 py-1 rounded-md w-fit uppercase tracking-wider">{settings.promoTitle || 'PROMO'}</span>
                        <div className="text-white font-bold text-base mt-1">Live Banner Preview</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Coupons */}
              <div className="border rounded-2xl p-4 bg-slate-50/40">
                <h4 className="font-bold text-slate-800 mb-1 flex items-center gap-2">🎟️ {lang === 'bn' ? 'ডিসকাউন্ট কুপন কোড' : 'Discount Coupons'}</h4>
                <p className="text-xs text-slate-500 mb-3">{lang === 'bn' ? 'ফরম্যাট: CODE=DISCOUNT, যেমন: WELCOME10=10%, TK50=50 (কমা দিয়ে আলাদা করুন)' : 'Format: CODE=DISCOUNT, e.g. WELCOME10=10%, TK50=50 (comma separated)'}</p>
                <input
                  className="w-full border rounded-xl px-3.5 py-2.5 font-mono bg-white text-sm"
                  value={couponDraft}
                  onChange={e => setCouponDraft(e.target.value)}
                  placeholder="WELCOME10=10%, TK50=50, SPECIAL=100"
                />
                {/* Visual decoded coupons chips */}
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {couponDraft.split(',').map((item, idx) => {
                    const [k, v] = item.split('=').map(x => x?.trim());
                    if (!k) return null;
                    return (
                      <span key={idx} className="inline-flex items-center gap-1.5 bg-orange-100/70 border border-orange-200 text-[#5a2e0d] px-2.5 py-1 rounded-lg text-xs font-bold">
                        <Tag size={12} />
                        <span className="font-mono">{k.toUpperCase()}</span>
                        <span className="bg-white/80 px-1.5 py-0.5 rounded text-[11px] font-semibold text-orange-800">{v || '—'}</span>
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Save Button */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSaveSettings}
                  disabled={settingsSaving}
                  className="text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-md hover:opacity-95 transition cursor-pointer disabled:opacity-50"
                  style={{ background: BROWN }}
                >
                  {settingsSaving ? (
                    <>⏳ {lang === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...'}</>
                  ) : (
                    <>✓ {lang === 'bn' ? 'সব সেটিংস সেভ করুন (Save Settings)' : 'Save Settings'}</>
                  )}
                </button>
                {settingsSuccess && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <Check size={16} /> {lang === 'bn' ? 'সেটিংস সফলভাবে সংরক্ষিত হয়েছে!' : 'Settings saved and synced!'}
                  </span>
                )}
              </div>

              {/* Admin Password & Security Manager */}
              <div className="mt-8 border-t border-slate-200 pt-6">
                <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/30 border border-amber-200/80 rounded-2xl p-5 shadow-xs">
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#5a2e0d] text-white flex items-center justify-center shrink-0">
                        <Lock size={18} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm md:text-base">
                          {lang === 'bn' ? '🔐 অ্যাডমিন পাসওয়ার্ড পরিবর্তন (Admin Password)' : '🔐 Change Admin Password'}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {lang === 'bn' ? `বর্তমান অ্যাডমিন: ${me.email}` : `Current Admin: ${me.email}`}
                        </p>
                      </div>
                    </div>
                    {me.authProvider === 'google' && (
                      <span className="text-[11px] bg-sky-100 text-sky-800 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                        <ShieldCheck size={13} /> {lang === 'bn' ? 'Google সাইন-ইন সক্রিয়' : 'Google Auth Active'}
                      </span>
                    )}
                  </div>

                  <form onSubmit={handleUpdateAdminPassword} className="grid gap-3 mt-4">
                    <p className="text-xs text-slate-600">{lang === 'bn' ? 'নিরাপত্তার জন্য নতুন পাসওয়ার্ড সরাসরি এখানে রাখা হয় না। Firebase আপনার ইমেইলে একটি secure reset link পাঠাবে।' : 'For security, passwords are never stored in this app. Firebase will send a secure reset link to your email.'}</p>
                    <div className="flex items-center gap-3 pt-1 flex-wrap">
                      <button
                        type="submit"
                        disabled={passUpdating}
                        className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-6 py-2.5 rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        <Key size={14} />
                        {passUpdating ? (lang === 'bn' ? 'পাঠানো হচ্ছে...' : 'Sending...') : (lang === 'bn' ? 'Password reset link পাঠান' : 'Send password reset link')}
                      </button>
                      {passMsg && (
                        <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${passMsg.type === 'ok' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {passMsg.text}
                        </span>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* In-App Delete Confirmation Modal (Delete Box) */}
          {deleteConfirm && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs" onClick={() => setDeleteConfirm(null)}>
              <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-scale-up" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4 mx-auto">
                  <Trash2 size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 text-center mb-2">
                  {lang === 'bn' ? 'মুছে ফেলার নিশ্চিতকরণ' : 'Confirm Deletion'}
                </h3>
                <p className="text-sm text-slate-600 text-center mb-6">
                  {lang === 'bn' ? (
                    <>আপনি কি নিশ্চিত যে <b>"{deleteConfirm.name}"</b> মুছে ফেলতে চান? এই অ্যাকশনটি ফিরিয়ে আনা যাবে না।</>
                  ) : (
                    <>Are you sure you want to delete <b>"{deleteConfirm.name}"</b>? This action cannot be undone.</>
                  )}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                  </button>
                  <button
                    onClick={executeDelete}
                    className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold transition-colors shadow-sm cursor-pointer"
                  >
                    {lang === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                  </button>
                </div>
              </div>
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
    <div className="min-h-screen bg-[#f7f4ef] pb-20 md:pb-0">
      {/* topbar */}
      <div className="store-topbar text-white text-xs md:text-sm" style={{ background: BROWN_D }}>
        <div className="max-w-7xl mx-auto px-3 py-2 flex items-center gap-2">
          <span className="font-medium truncate min-w-0">{lang === 'bn' ? settings.announcement.replace('Welcome to Murad Graphics!', 'মুরাদ গ্রাফিক্সে স্বাগতম!') : settings.announcement}</span>
          <div className="flex-1" />
          <button onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')} className="shrink-0 flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg font-bold cursor-pointer transition"><Globe size={13} />{lang === 'bn' ? 'বাংলা' : 'EN'}</button>
          <button onClick={() => { if (!me) { setAuthOpen('login'); fail(t.loginRequired); return; } setView('orders'); }} className="hover:text-orange-200 font-semibold hidden sm:block cursor-pointer">{t.myOrders}</button>
          <a href={waLink(settings.whatsapp, 'Support needed')} target="_blank" rel="noreferrer" className="hover:text-orange-200 font-semibold">{t.support}</a>
        </div>
      </div>

      {/* header */}
      <header className="store-header text-white sticky top-0 z-30 shadow-lg w-full" style={{ background: BROWN }}>
        <div className="max-w-7xl mx-auto px-3 py-2.5 sm:py-3 flex items-center gap-3">
          <button onClick={() => setView('home')} className="shrink-0 cursor-pointer"><Logo /></button>
          <div className="header-search flex-1 max-w-2xl mx-auto relative flex items-center">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && setView('products')}
              placeholder={t.searchPh}
              className="w-full rounded-full pl-4 pr-12 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-800 bg-white shadow-xs focus:ring-2 focus:ring-cyan-400"
            />
            <button
              onClick={() => setView('products')}
              className="absolute right-1 w-8 h-8 sm:w-9 sm:h-9 rounded-full text-white flex items-center justify-center cursor-pointer transition hover:opacity-90 shrink-0"
              style={{ background: BROWN_D }}
            >
              <Search size={16} />
            </button>
          </div>
          <div className="flex-1 sm:hidden" />
          <div className="mobile-header-actions sm:hidden flex items-center gap-1">
            <button onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')} aria-label="Change language" className="header-icon-btn p-1.5 rounded-full hover:bg-white/10 cursor-pointer"><Globe size={18} /></button>
            <button onClick={() => { if (!me) { setAuthOpen('login'); fail(t.loginRequired); return; } setView('orders'); }} aria-label="Notifications and orders" className="header-icon-btn p-1.5 rounded-full hover:bg-white/10 cursor-pointer"><Bell size={19} /></button>
          </div>
          {me ? (
            <div className="relative">
              <button onClick={() => setAcctMenu(!acctMenu)} className="hidden md:flex items-center gap-1.5 border border-white/30 rounded-full px-4 py-2 text-sm font-bold hover:bg-white/10 cursor-pointer">
                {me.photoURL ? (
                  <img src={me.photoURL} alt={me.name} className="w-6 h-6 rounded-full object-cover border border-white/40" referrerPolicy="no-referrer" />
                ) : (
                  <UserIcon size={16} />
                )}
                <span className="truncate max-w-[100px]">{me.name.split(' ')[0]}</span>
                <ChevronDown size={14} />
              </button>
              <button onClick={() => setAcctMenu(!acctMenu)} className="md:hidden p-1.5 border border-white/30 rounded-full flex items-center justify-center cursor-pointer">
                {me.photoURL ? (
                  <img src={me.photoURL} alt={me.name} className="w-7 h-7 rounded-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <UserIcon size={17} />
                )}
              </button>
              {acctMenu && <div className="absolute right-0 mt-2 w-52 bg-white text-slate-700 rounded-2xl shadow-2xl overflow-hidden text-sm z-50">
                <div className="px-4 py-2.5 border-b text-xs text-slate-400 truncate">{me.email}</div>
                {me.role === 'admin'
                  ? <button onClick={() => { setAcctMenu(false); setView('admin'); }} className="w-full text-left px-4 py-2.5 hover:bg-orange-50 font-semibold flex items-center gap-2 cursor-pointer"><LayoutDashboard size={14} />{t.adminPanel}</button>
                  : <><button onClick={() => { setAcctMenu(false); setView('dashboard'); }} className="w-full text-left px-4 py-2.5 hover:bg-orange-50 font-semibold flex items-center gap-2 cursor-pointer"><LayoutDashboard size={14} />{t.dashboard}</button>
                    <button onClick={() => { setAcctMenu(false); setView('purchases'); }} className="w-full text-left px-4 py-2.5 hover:bg-orange-50 font-semibold flex items-center gap-2 cursor-pointer"><Download size={14} />{t.myPurchases}</button>
                    <button onClick={() => { setAcctMenu(false); setView('orders'); }} className="w-full text-left px-4 py-2.5 hover:bg-orange-50 font-semibold flex items-center gap-2 cursor-pointer"><History size={14} />{t.orderHistory}</button></>}
                <button onClick={logout} className="w-full text-left px-4 py-2.5 hover:bg-rose-50 text-rose-600 font-semibold flex items-center gap-2 cursor-pointer"><LogOut size={14} />{t.logout}</button>
              </div>}
            </div>
          ) : <button onClick={() => setAuthOpen('login')} className="hidden md:flex items-center gap-1.5 border border-white/30 rounded-full px-4 py-2 text-sm font-bold hover:bg-white/10 cursor-pointer"><UserIcon size={16} />{t.login}</button>}
          <button onClick={() => { if (!me) { setAuthOpen('login'); fail(t.loginRequired); return; } setView('orders'); }} className="p-2 sm:p-2.5 hover:bg-white/10 rounded-full cursor-pointer hidden sm:block"><Box size={19} /></button>
          <button onClick={() => setView('cart')} className="header-cart p-2 sm:p-2.5 hover:bg-white/10 rounded-full relative cursor-pointer"><ShoppingCart size={20} />{cart.length > 0 && <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold text-white">{cart.length}</span>}</button>
        </div>
        <div className="mobile-secondary-search hidden px-3 pb-2.5">
          <div className="relative flex items-center w-full">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && setView('products')}
              placeholder={t.searchPh}
              className="w-full rounded-full pl-4 pr-11 py-2 text-xs text-slate-800 bg-white shadow-xs focus:ring-2 focus:ring-amber-400"
            />
            <button
              onClick={() => setView('products')}
              className="absolute right-1 w-7 h-7 rounded-full text-white flex items-center justify-center cursor-pointer transition hover:opacity-90 shrink-0"
              style={{ background: BROWN_D }}
            >
              <Search size={13} />
            </button>
          </div>
        </div>
      </header>

      {/* ============ HOME ============ */}
      {view === 'home' && <>
        {/* Reference-matched mobile home. Desktop/home logic remains untouched. */}
        <section className="mg-mobile-home sm:hidden">
          <div className="mg-mobile-hero">
            <div className="mg-mobile-hero-copy">
              <div className="mg-eyebrow">PREMIUM DIGITAL STORE</div>
              <h1>Digital<br />Products,<br /><span>Instant Access</span></h1>
              <p>Get high-quality digital products, templates, software and more — instantly after purchase.</p>
              <button onClick={() => setView('products')}>{t.shopNow} <ArrowRight size={15} /></button>
            </div>
            <div className="mg-mobile-hero-art">
              {hero && <img src={hero.previewImages[0] || IMG(hero.id)} alt={hero.name} onError={e => { const im=e.target as HTMLImageElement; im.onerror=null; im.src=IMG(hero.id); }} />}
            </div>
            {slides.length > 1 && <div className="mg-mobile-dots">{slides.slice(0,5).map((x,i)=><button key={x.id} onClick={()=>setSlide(i)} className={i===slide?'active':''} />)}</div>}
          </div>

          <div className="mg-mobile-trust">
            {([[Zap,'Instant Access','Get your files instantly'],[ShieldCheck,'Verified Payment','Safe & secure'],[Headphones,'24/7 Support',"We're here 24/7"],[Download,'Lifetime Library','Access anytime']] as [typeof Zap,string,string][]).map(([Icon,title,sub]) =>
              <div key={title}><span><Icon size={21}/></span><b>{title}</b><small>{sub}</small></div>
            )}
          </div>

          <button className="mg-mobile-promo" onClick={() => setView('products')}>
            <img src={settings.promoImage || IMG('promo', 1000)} alt="" onError={e=>{const im=e.target as HTMLImageElement; im.onerror=null; im.src=IMG('promo',1000);}} />
            <span className="mg-promo-copy"><b>{settings.promoTitle || 'Mega Bundle Sale'}</b><small>Get Premium Digital Products<br />at Unbeatable Prices!</small><em>{t.shopNow} <ArrowRight size={14}/></em></span>
          </button>

          <div className="mg-mobile-section-head">
            <div><LayoutGrid size={25}/><h2>{t.shopByCat}</h2></div>
            <button onClick={()=>{setCatFilter('All');setView('products')}}>{t.seeAll}<ChevronRight size={18}/></button>
          </div>
          <div className="mg-mobile-categories">
            {activeCats.slice(0,6).map((c,i)=>{
              const CatIcon = [LayoutGrid, Tag, Box, Store, Package, Globe][i] || Tag;
              return <button key={c.id} onClick={()=>{setCatFilter(c.id);setView('products')}}>
              {c.image && !c.image.includes('picsum.photos') ? <img src={c.image} alt={c.name} onError={e=>{const im=e.target as HTMLImageElement;im.onerror=null;im.src=IMG(c.id,200)}}/> : <span className={`mg-cat-icon c${i}`}><CatIcon size={25}/></span>}
              <b>{c.name}</b>
            </button>;
            })}
          </div>

          <div className="mg-mobile-section-head mg-trending-head">
            <div><span className="mg-fire">♦</span><h2>{t.newTrending}</h2></div>
            <button onClick={()=>setView('products')}>{t.seeAll}<ChevronRight size={18}/></button>
          </div>
          <div className="mg-mobile-products">
            {activeProducts.slice(0,4).map(p=>{
              const owned=owns(sessionId,p.id);
              return <article key={p.id} className="mg-mobile-product" onClick={()=>goDetails(p.id)}>
                <div className="mg-product-image"><img src={p.previewImages[0] || IMG(p.id)} alt={p.name} onError={e=>{const im=e.target as HTMLImageElement;im.onerror=null;im.src=IMG(p.id)}}/>
                  <span>{owned ? t.ownedBadge : t.digitalTag}</span>
                </div>
                <div className="mg-product-info">
                  <h3>{p.name}</h3>
                  <div className="mg-rating"><Star size={13} className="fill-amber-400 text-amber-400"/>{p.rating} <small>({p.sold.toLocaleString()})</small></div>
                  <div className="mg-price">{tk(eff(p))} {offPct(p)>0 && <s>{tk(p.price)}</s>}</div>
                  <button onClick={e=>{e.stopPropagation();owned?openAccess(sessionId,p.id):addCart(p.id)}}>{owned?<Download size={14}/>:<Download size={14}/>} {owned?t.download:t.instantAccess}</button>
                </div>
              </article>
            })}
          </div>
        </section>

        <div className="mg-desktop-home-only">

        <div className="home-top-grid max-w-7xl mx-auto px-3 py-3 sm:py-4 grid lg:grid-cols-[1fr_280px] gap-4">
          <div className="home-hero relative overflow-hidden rounded-2xl sm:rounded-[1.75rem] mesh-hero shadow-2xl shadow-orange-950/30">
          <div className="blob w-80 h-80 bg-orange-500/40 -top-16 -left-16" />
          <div className="blob w-96 h-96 bg-amber-500/25 bottom-[-6rem] right-[8%]" style={{ animationDelay: '-4s' }} />
          <div className="grid-pattern absolute inset-0" />
          <div className="relative grid lg:grid-cols-2 gap-6 sm:gap-8 items-center p-5 sm:p-8 md:p-12 text-white">
            <div className="home-hero-copy fade-up">
              <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-full px-3 py-1 text-[10px] sm:text-[11px] font-bold tracking-[.18em] text-amber-200">✦ {lang === 'bn' ? 'প্রিমিয়াম ডিজিটাল স্টোর' : 'PREMIUM DIGITAL STORE'}</span>
              <h1 className="font-display text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-[1.12] mt-3 sm:mt-4">{lang === 'bn' ? (<>ডিজিটাল প্রোডাক্ট,<br /><span className="gold-text">ইনস্ট্যান্ট অ্যাক্সেস</span></>) : (<>Digital products,<br /><span className="gold-text">instant access</span></> )}</h1>
              <p className="text-orange-100/90 text-xs sm:text-sm md:text-base mt-2.5 sm:mt-4 max-w-md leading-relaxed">{lang === 'bn' ? 'পেমেন্ট ভেরিফাই হলেই Google Drive অ্যাক্সেস — কোনো অপেক্ষা নেই, কোনো ডেলিভারি চার্জ নেই।' : 'Verified payment unlocks Google Drive access instantly — no waiting, no delivery fees.'}</p>
              <div className="flex flex-wrap gap-2 sm:gap-2.5 mt-4 sm:mt-6">
                <button onClick={() => setView('products')} className="bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 text-white font-black px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-full text-xs sm:text-sm shadow-lg shadow-orange-950/40 transition flex items-center gap-1.5 cursor-pointer">{t.shopNow}<ArrowRight size={15} /></button>
                {!me && <button onClick={() => setAuthOpen('register')} className="glass px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-full font-bold text-xs sm:text-sm hover:bg-white/15 transition cursor-pointer">{t.createAccount}</button>}
              </div>
              <div className="flex items-center gap-3 sm:gap-4 mt-6 sm:mt-8 flex-wrap">
                <div className="flex -space-x-2">{['R', 'S', 'N', 'T'].map((c, i) => <span key={i} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-[#3d1e07] flex items-center justify-center text-[10px] sm:text-xs font-black text-white" style={{ background: ['#b45309', '#047857', '#1d4ed8', '#be123c'][i] }}>{c}</span>)}</div>
                <div className="text-[11px] sm:text-xs"><div className="flex items-center gap-1">{[1, 2, 3, 4, 5].map(s => <Star key={s} size={11} className="fill-amber-400 text-amber-400" />)}<b className="ml-1">4.9</b></div><span className="text-orange-100/70">{users.filter(u => u.role === 'customer').length * 1240}+ happy customers</span></div>
                <div className="h-8 w-px bg-white/15 hidden sm:block" />
                <div className="hidden sm:block"><div className="font-display font-black text-xl sm:text-2xl">{activeProducts.length * 36}+</div><div className="text-[10px] sm:text-[11px] text-orange-100/70">products sold</div></div>
              </div>
            </div>
            <div className="home-hero-visual relative mt-2 lg:mt-0">
              {hero && (
                <div key={hero.id + slide} className="slide-in relative mx-auto max-w-md">
                  <div className="float-slow relative overflow-hidden rounded-2xl sm:rounded-3xl">
                    <img src={hero.previewImages[0] || IMG(hero.id)} alt={hero.name} className="w-full h-48 sm:h-64 md:h-80 object-cover rounded-2xl sm:rounded-3xl shadow-2xl rotate-1 sm:rotate-2 border border-white/20" onError={e => { const im = e.target as HTMLImageElement; im.onerror = null; im.src = IMG(hero.id); }} />
                    <div className="mobile-hero-overlay absolute inset-0 rounded-2xl p-4 flex flex-col justify-end items-start text-white">
                      <span className="mobile-hero-badge inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-[#4a250d]">✦ {lang === 'bn' ? 'আজকের অফার' : 'TODAY\'S OFFER'}</span>
                      <h2 className="mt-2 max-w-[72%] font-display text-lg font-black leading-tight drop-shadow-md">{hero.name}</h2>
                      <p className="mt-1 max-w-[68%] text-[10px] font-medium leading-snug text-white/90">{lang === 'bn' ? 'পেমেন্ট ভেরিফাই হলেই ইনস্ট্যান্ট অ্যাক্সেস' : 'Instant access after payment verification'}</p>
                      <button onClick={() => goDetails(hero.id)} className="mt-2 rounded-full bg-white px-3.5 py-1.5 text-[10px] font-black text-[#5a2e0d] shadow-lg cursor-pointer transition active:scale-95">{lang === 'bn' ? 'এখনই দেখুন' : 'Explore now'} <ArrowRight size={11} className="inline" /></button>
                    </div>
                  </div>
                  <div className="absolute -left-1 sm:-left-4 bottom-4 sm:bottom-8 glass rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3 float-slower shadow-xl">
                    <div className="text-[9px] sm:text-[10px] text-orange-200/80 font-bold tracking-wider">{t.grandTotal}</div>
                    <div className="font-display font-black text-lg sm:text-2xl text-white">{tk(eff(hero))}</div>
                    <button onClick={() => goDetails(hero.id)} className="mt-1 bg-gradient-to-r from-orange-400 to-amber-500 text-[10px] sm:text-[11px] font-black px-3 sm:px-4 py-1.5 rounded-full shadow cursor-pointer">{t.orderNow}</button>
                  </div>
                  <div className="absolute -right-1 sm:-right-4 top-4 sm:top-6 glass rounded-xl sm:rounded-2xl px-2.5 sm:px-3.5 py-1.5 sm:py-2.5 flex items-center gap-1.5 sm:gap-2 float-slow shadow-xl" style={{ animationDelay: '-2.5s' }}>
                    <BadgeCheck size={18} className="text-emerald-300 shrink-0" />
                    <div className="text-[10px] sm:text-[11px] font-bold text-white leading-tight">{t.verifiedPay}<br /><span className="text-orange-200/70 font-medium">{t.instantAccess}</span></div>
                  </div>
                </div>
              )}
              {slides.length > 1 && <>
                <button onClick={() => setSlide((slide - 1 + slides.length) % slides.length)} className="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white items-center justify-center text-slate-700 hidden md:flex cursor-pointer"><ChevronLeft size={16} /></button>
                <button onClick={() => setSlide((slide + 1) % slides.length)} className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white items-center justify-center text-slate-700 hidden md:flex cursor-pointer"><ChevronRight size={16} /></button>
                <div className="flex justify-center gap-1.5 mt-3">{slides.map((s, i) => <button key={s.id} onClick={() => setSlide(i)} className={`h-1.5 rounded-full transition-all cursor-pointer ${i === slide ? 'w-6 bg-amber-400' : 'w-1.5 bg-white/40'}`} />)}</div>
              </>}
            </div>
          </div>
        </div>
          <div className="home-trust bg-white rounded-2xl p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2 content-start shadow-xs">
            {trustItems.map(([Icon, label]) => (
              <div key={label} className="flex items-center gap-2.5 bg-white border border-orange-100 hover:border-orange-300 rounded-xl px-3 py-2.5 transition cursor-default">
                <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center shrink-0"><Icon size={16} style={{ color: BROWN }} /></span>
                <span className="text-xs font-semibold text-slate-700 leading-tight">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="home-category-row max-w-7xl mx-auto px-3 grid lg:grid-cols-[1fr_340px] gap-4 sm:gap-6 items-start">
          <div>
            <div className="home-category flex items-center justify-between mb-3">
              <h2 className="font-display font-black text-base sm:text-xl text-slate-800 flex items-center gap-2 reveal"><LayoutGrid size={18} style={{ color: BROWN }} />{t.shopByCat}</h2>
              <button onClick={() => { setCatFilter('All'); setView('products'); }} className="text-xs font-bold flex items-center gap-1 hover:gap-2 transition-all cursor-pointer" style={{ color: BROWN }}>{t.seeAll}<ChevronRight size={14} /></button>
            </div>
            <div className="flex gap-3 sm:gap-5 overflow-x-auto no-scrollbar pb-2 stagger-in">
              {activeCats.map(c => (
                <button key={c.id} onClick={() => { setCatFilter(c.id); setView('products'); }} className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer">
                  {c.image ? <img src={c.image} alt={c.name} className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full object-cover ring-3 ring-orange-100 group-hover:ring-orange-300 transition" onError={e => { const im = e.target as HTMLImageElement; im.onerror = null; im.src = IMG(c.id, 200); }} />
                    : <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-orange-200 to-amber-100 flex items-center justify-center ring-3 ring-orange-100"><Tag size={22} style={{ color: BROWN }} /></div>}
                  <span className="text-[11px] sm:text-xs font-medium text-slate-700 whitespace-nowrap">{c.name}</span>
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => setView('products')} className="home-promo relative rounded-2xl overflow-hidden text-left group reveal cursor-pointer">
            <img src={settings.promoImage || IMG('promo', 800)} alt="" className="w-full h-32 sm:h-40 md:h-44 object-cover group-hover:scale-105 transition duration-500" onError={e => { const im = e.target as HTMLImageElement; im.onerror = null; im.src = IMG('promo', 800); }} />
            <span className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <span className="absolute bottom-2.5 left-1/2 -translate-x-1/2 text-[10px] sm:text-[11px] font-black bg-white px-3.5 py-1 rounded-full whitespace-nowrap shadow" style={{ color: BROWN }}>{settings.promoTitle} • {t.shopNow}</span>
          </button>
        </div>

        <main className="home-desktop-main max-w-7xl mx-auto px-3 py-4 sm:py-6">
          <h2 className="font-display font-black text-lg sm:text-2xl text-slate-800 mb-3 sm:mb-4 flex items-center gap-2 reveal"><span className="w-1.5 h-6 sm:h-7 rounded-full" style={{ background: BROWN }} /><Zap size={18} style={{ color: BROWN }} />{t.newTrending}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2.5 sm:gap-4 stagger-in">{activeProducts.slice(0, 5).map(p => <ProductCard key={p.id} p={p} />)}</div>

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
        </div>
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
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="text-xs text-slate-500 flex items-center gap-1.5 min-w-0"><button onClick={() => { window.history.pushState({}, '', '/products'); setDetailId(null); setView('products'); }} className="hover:text-[#7c2d12] flex items-center gap-1 shrink-0"><ArrowLeft size={13} />{t.products}</button><ChevronRight size={12} /><span className="text-slate-800 font-medium truncate">{detail.name}</span></div>
            <button onClick={() => { window.history.pushState({}, '', '/'); setDetailId(null); setView('home'); }} className="text-xs font-bold text-[#5a2e0d] border border-orange-200 hover:bg-orange-50 px-2.5 py-1.5 rounded-lg flex items-center gap-1 shrink-0"><Store size={13} />{t.home}</button>
          </div>
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
                    <div key={r.id || `${r.userId || 'review'}-${i}`} className="border-b py-3 text-sm"><div className="flex items-center gap-2"><b>{r.name}</b><span className="flex">{[1, 2, 3, 4, 5].map(s => <Star key={s} size={12} className={s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />)}</span>{r.verified && <span className="text-[10px] text-emerald-600 font-bold">✓ Verified Buyer</span>}<span className="text-xs text-slate-400">{r.date}</span></div><p className="text-slate-600 mt-1">{r.text}</p></div>
                  ))}
                  {me && owns(me.id, detail.id) ? (cloudReviews[detail.id] || detail.reviews).some(r => r.userId === me.id) ? <p className="text-sm text-emerald-700 bg-emerald-50 rounded-xl p-3 mt-4">{lang === 'bn' ? 'আপনার verified rating সংরক্ষিত আছে।' : 'Your verified rating is already saved.'}</p> : <>
                    <h4 className="font-bold text-sm mt-4">{t.writeReview}</h4>
                    <div className="grid gap-2 mt-2 text-sm">
                      <div className="flex flex-wrap gap-2 items-center">
                        <input value={revName} onChange={e => setRevName(e.target.value)} placeholder={t.yourName} className="flex-1 min-w-[140px] border rounded-xl px-3 py-2" />
                        <div className="flex gap-0.5">{[1, 2, 3, 4, 5].map(s => <button key={s} onClick={() => setRevStars(s)}><Star size={20} className={s <= revStars ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} /></button>)}</div>
                      </div>
                      <textarea value={revText} onChange={e => setRevText(e.target.value)} placeholder={t.yourReview} rows={3} className="border rounded-xl px-3 py-2" />
                      <button onClick={addReview} className="text-white font-bold py-2.5 rounded-xl w-fit px-8" style={{ background: BROWN }}>{t.submit}</button>
                    </div>
                  </> : <p className="text-sm text-slate-500 bg-slate-50 rounded-xl p-3 mt-4">{lang === 'bn' ? 'Rating দিতে এই পণ্যটি আগে কিনে account-এ login করুন।' : 'Purchase and sign in to rate this product.'}</p>}
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
          <div><img src="/murad-logo-full.svg" alt="Murad Graphics Digital Store" className="footer-brand-logo w-56 max-w-full h-auto" /><p className="mt-3 text-xs leading-relaxed">{t.digitalNote}</p>
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
      <a href={waLink(settings.whatsapp, t.supportTitle)} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp" className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-30 bg-[#25d366] w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-2xl float-wa cursor-pointer transition hover:scale-105" title="Chat on WhatsApp">
        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40 animate-ping" />
        <WhatsAppLogo size={27} />
      </a>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-1 py-1.5 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => setView('home')}
          className={`mobile-nav-home flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition cursor-pointer ${view === 'home' ? 'mobile-nav-active text-[#1e5bd7] font-bold' : 'text-slate-500 font-medium'}`}
        >
          <Store size={19} className={view === 'home' ? 'text-[#1e5bd7]' : 'text-slate-500'} />
          <span className="text-[10px] leading-none">{lang === 'bn' ? 'হোম' : 'Home'}</span>
        </button>

        <button
          onClick={() => { setCatFilter('All'); setView('products'); }}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition cursor-pointer ${view === 'products' ? 'text-[#1e5bd7] font-bold' : 'text-slate-500 font-medium'}`}
        >
          <Package size={19} className={view === 'products' ? 'text-[#1e5bd7]' : 'text-slate-500'} />
          <span className="text-[10px] leading-none">{lang === 'bn' ? 'প্রোডাক্ট' : 'Shop'}</span>
        </button>

        <button
          onClick={() => setView('cart')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition cursor-pointer relative ${view === 'cart' ? 'text-[#1e5bd7] font-bold' : 'text-slate-500 font-medium'}`}
        >
          <div className="relative">
            <ShoppingCart size={19} className={view === 'cart' ? 'text-[#1e5bd7]' : 'text-slate-500'} />
            {cart.length > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {cart.length}
              </span>
            )}
          </div>
          <span className="text-[10px] leading-none">{lang === 'bn' ? 'কার্ট' : 'Cart'}</span>
        </button>

        <button
          onClick={() => { if (!me) { setAuthOpen('login'); fail(t.loginRequired); return; } setView('purchases'); }}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition cursor-pointer ${view === 'purchases' ? 'text-[#1e5bd7] font-bold' : 'text-slate-500 font-medium'}`}
        >
          <Download size={19} className={view === 'purchases' ? 'text-[#1e5bd7]' : 'text-slate-500'} />
          <span className="text-[10px] leading-none">{lang === 'bn' ? 'লাইব্রেরি' : 'Library'}</span>
        </button>

        <button
          onClick={() => {
            if (!me) { setAuthOpen('login'); return; }
            if (me.role === 'admin') setView('admin');
            else setView('dashboard');
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition cursor-pointer ${view === 'dashboard' ? 'text-[#1e5bd7] font-bold' : 'text-slate-500 font-medium'}`}
        >
          {me?.role === 'admin' ? (
            <LayoutDashboard size={19} className="text-slate-500" />
          ) : (
            <UserIcon size={19} className={view === 'dashboard' ? 'text-[#1e5bd7]' : 'text-slate-500'} />
          )}
          <span className="text-[10px] leading-none">{me ? (me.role === 'admin' ? (lang === 'bn' ? 'অ্যাডমিন' : 'Admin') : (lang === 'bn' ? 'অ্যাকাউন্ট' : 'Account')) : (lang === 'bn' ? 'লগইন' : 'Login')}</span>
        </button>
      </nav>

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
            <div className="flex justify-center"><img src="/murad-logo-mark.svg" alt="Murad Graphics" className="w-12 h-12 rounded-2xl object-cover" /></div>
            <h3 className="font-black text-center mt-2 text-lg">{authOpen === 'login' ? t.welcomeBack : t.createAccount}</h3>
            <p className="text-[11px] text-center text-slate-400 mt-0.5">{authOpen === 'login' ? (lang === 'bn' ? 'আপনার অ্যাকাউন্টে লগইন করুন' : 'Sign in to your account') : (lang === 'bn' ? 'নতুন অ্যাকাউন্ট তৈরি করুন' : 'Create your free account')}</p>
            <div className="grid gap-2 mt-3 text-sm">
              <button
                type="button"
                disabled={authLoading}
                onClick={handleGoogleAuth}
                className="w-full border border-slate-300 hover:border-slate-400 disabled:opacity-60 bg-white hover:bg-slate-50 text-slate-700 font-semibold py-2.5 px-4 rounded-2xl flex items-center justify-center gap-2.5 transition-colors shadow-sm cursor-pointer disabled:cursor-not-allowed"
              >
                {authLoading ? (
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                )}
                <span>{authLoading ? (lang === 'bn' ? 'সাইন-ইন হচ্ছে...' : 'Signing in...') : (lang === 'bn' ? 'গুগল দিয়ে প্রবেশ করুন' : 'Continue with Google')}</span>
              </button>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-medium">{lang === 'bn' ? 'অথবা ইমেইল দিয়ে' : 'or with email'}</span></div>
              </div>

              {authOpen === 'register' && <input className="border rounded-xl px-3 py-2.5" placeholder={t.name} value={authForm.name} onChange={e => setAuthForm({ ...authForm, name: e.target.value })} />}
              <input className="border rounded-xl px-3 py-2.5" placeholder={t.email} value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} />
              <input type="password" className="border rounded-xl px-3 py-2.5" placeholder={t.password} value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} onKeyDown={e => e.key === 'Enter' && (authOpen === 'login' ? doLogin() : doRegister())} />
              {authOpen === 'login' && <button type="button" onClick={async () => { try { if (!authForm.email.trim()) throw new Error(lang === 'bn' ? 'আগে ইমেইল লিখুন।' : 'Enter your email first.'); await resetPassword(authForm.email.trim()); setAuthErr(lang === 'bn' ? 'Password reset link ইমেইলে পাঠানো হয়েছে।' : 'Password reset link sent to your email.'); } catch (e: unknown) { setAuthErr(e instanceof Error ? e.message : 'Could not send reset link.'); } }} className="text-right text-xs font-semibold text-slate-500 hover:text-[#5a2e0d]">{lang === 'bn' ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot password?'}</button>}
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
