export type Role = 'customer' | 'admin';
export type User = { id: string; name: string; email: string; pass: string; role: Role; createdAt: string };
export type Category = { id: string; name: string; slug: string; image: string; status: 'active' | 'hidden' };
export type Review = { name: string; rating: number; text: string; date: string };
export type Product = {
  id: string; name: string; slug: string; description: string;
  price: number; discountPrice?: number; categoryId: string;
  previewImages: string[]; googleDriveLink: string; features: string[];
  reviews: Review[]; status: 'active' | 'hidden';
  rating: number; sold: number; createdAt: string;
};
export type OrderItem = { productId: string; name: string; price: number };
export type Order = {
  id: string; userId: string; items: OrderItem[];
  subtotal: number; discount: number; total: number; coupon: string;
  paymentMethod: string; paymentStatus: 'Pending' | 'Paid' | 'Failed';
  orderStatus: 'Awaiting Verification' | 'Completed' | 'Payment Failed';
  trxId: string; createdAt: string;
};
export type Purchase = { id: string; userId: string; productId: string; orderId: string; accessStatus: 'active' | 'revoked'; purchasedAt: string };
export type Payment = { id: string; orderId: string; userId: string; amount: number; transactionId: string; method: string; status: 'Pending' | 'Paid' | 'Failed'; createdAt: string };
export type Settings = {
  storeName: string; announcement: string; whatsapp: string;
  bkash: string; nagad: string; rocket: string; binance: string;
  promoImage: string; promoTitle: string;
  facebook: string; youtube: string; instagram: string; telegram: string;
  coupons: Record<string, string>;
};
export type CartLine = { productId: string };
export type View = 'home' | 'products' | 'details' | 'cart' | 'checkout' | 'orders' | 'purchases' | 'dashboard' | 'admin';

// ---------- helpers ----------
export const load = <T,>(k: string, fb: T): T => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) as T : fb; } catch { return fb; } };
export const save = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* full */ } };
export const tk = (n: number) => '৳' + n.toLocaleString('en-IN');
export const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9\u0980-\u09FF]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || ('item-' + Date.now());
export const uid = (p: string) => p + '-' + Date.now().toString(36) + Math.floor(Math.random() * 999);
export const nowStr = () => new Date().toLocaleString('bn-BD');
export const eff = (p: Product) => (p.discountPrice && p.discountPrice < p.price ? p.discountPrice : p.price);
export const offPct = (p: Product) => (p.discountPrice && p.discountPrice < p.price ? Math.round((1 - p.discountPrice / p.price) * 100) : 0);
export const waLink = (num: string, msg: string) => `https://wa.me/${num.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`;
export const IMG = (seed: string, w = 600) => `https://picsum.photos/seed/${seed}/${w}/600`;

export const fileToResizedDataUrl = (file: File, maxDim = 900, quality = 0.82): Promise<string> => new Promise((resolve, reject) => {
  if (!file.type.startsWith('image/')) { reject(new Error('শুধু image file (JPG/PNG) দিন।')); return; }
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    try {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const ctx = cv.getContext('2d');
      if (!ctx) throw new Error('এই browser-এ image process সম্ভব নয়।');
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(cv.toDataURL('image/jpeg', quality));
    } catch (e) { URL.revokeObjectURL(url); reject(e instanceof Error ? e : new Error('Image process failed')); }
  };
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image পড়া যায়নি।')); };
  img.src = url;
});

// ---------- seeds (digital products: DB holds links, files live on Drive) ----------
export const SEED_SETTINGS: Settings = {
  storeName: 'Murad Graphics',
  announcement: 'Welcome to Murad Graphics!',
  whatsapp: '8801977981796',
  bkash: '01977981796', nagad: '01977981796', rocket: '01977981796', binance: 'MPAY-882134',
  promoImage: IMG('mg-promo', 800), promoTitle: 'MEGA BUNDLE SALE',
  facebook: 'https://facebook.com/', youtube: 'https://youtube.com/', instagram: '#', telegram: 'https://t.me/',
  coupons: { WELCOME10: '10%', TK50: '50' },
};

export const SEED_CATS: Category[] = [
  { id: 'c-themes', name: 'Themes', slug: 'themes', image: IMG('cat-themes', 300), status: 'active' },
  { id: 'c-software', name: 'Software', slug: 'software', image: IMG('cat-soft', 300), status: 'active' },
  { id: 'c-bundles', name: 'Bundles', slug: 'bundles', image: IMG('cat-bundle', 300), status: 'active' },
  { id: 'c-subs', name: 'Subscriptions', slug: 'subscriptions', image: IMG('cat-subs', 300), status: 'active' },
  { id: 'c-accounts', name: 'Accounts', slug: 'accounts', image: IMG('cat-acc', 300), status: 'active' },
];

const P = (id: string, name: string, price: number, discountPrice: number | undefined, categoryId: string, seed: string, features: string[], rating: number, sold: number, desc: string): Product => ({
  id, name, slug: slugify(name) + '-' + id, description: desc, price, discountPrice, categoryId,
  previewImages: [IMG(seed, 700), IMG(seed + '-2', 700)],
  googleDriveLink: 'https://drive.google.com/drive/folders/MG-' + id.toUpperCase() + '-DELIVERY',
  features, reviews: [], status: 'active', rating, sold, createdAt: nowStr(),
});

export const SEED_PRODUCTS: Product[] = [
  P('p1', 'Velora Market — Blogger E-commerce Theme', 1200, 499, 'c-themes', 'mg-theme', ['100% editable layout', 'Cart + checkout + coupon system', 'bKash / Nagad / Rocket support', 'Fully responsive'], 4.9, 1240, 'Premium Blogger e-commerce theme — cart, checkout, coupon, WhatsApp chat. File Google Drive-এ, payment verify-এর পর access।'),
  P('p2', 'All In One PC Software Combo Package', 500, 299, 'c-software', 'mg-soft', ['Adobe Master Collection full', 'MS Office 2007–2024', 'Windows 7/10/11 Pro', 'Lifetime access'], 4.8, 2310, 'Adobe + Office + Windows + utilities mega bundle — lifetime Google Drive access।'),
  P('p3', 'Ultimate Digital Assets Mega Bundle', 500, 259, 'c-bundles', 'mg-bundle', ['100K meme pack', '10K PPT templates', '3M+ reels bundle', '50GB+ design pack'], 4.9, 3100, 'Freelancing + content creation mega combo — design packs, templates, courses এক ফ্রেমে।'),
  P('p4', 'Lovable Pro Lite — 12 Months + 300 Credits', 4000, 3000, 'c-subs', 'mg-lovable', ['12 months validity', '300 premium credits', 'Direct redeem link', '18hr hold warranty'], 5.0, 180, 'AI app builder Pro Lite 12 months — official redeem link email-এ ডেলিভারি।'),
  P('p5', 'YouTube Premium 3 Month Family Head Account', 5000, 1200, 'c-subs', 'mg-yt', ['Head family account', 'Up to 6 members', 'No ads + background play', 'YouTube Music Premium'], 4.9, 860, 'YouTube Premium family head account 3 months — instant ID-password inbox delivery।'),
  P('p6', 'Verified Fresh Gmail Accounts Pack', 500, 249, 'c-accounts', 'mg-gmail', ['100% verified & fresh', 'Phone verified', 'Instant inbox delivery'], 4.7, 5400, 'Phone verified fresh Gmail — marketing, social, official কাজে রেডি।'),
  P('p7', 'CapCut Pro 30 Days Team Access', 300, 250, 'c-subs', 'mg-capcut', ['Team Pro full access', 'No watermark + 4K export', 'Auto caption + AI features', '30 days warranty'], 4.8, 1950, 'CapCut Team Pro 30 days — premium effects, 4K export, mobile + PC।'),
];

export const SEED_USERS: User[] = [
  { id: 'u-admin', name: 'Murad Admin', email: 'admin@muradgraphics.store', pass: 'murad123', role: 'admin', createdAt: nowStr() },
  { id: 'u-demo', name: 'Shariful Islam', email: 'demo@demo.com', pass: 'demo123', role: 'customer', createdAt: nowStr() },
];

export const SEED_ORDERS: Order[] = [
  {
    id: 'MG-100001', userId: 'u-demo', items: [{ productId: 'p3', name: 'Ultimate Digital Assets Mega Bundle', price: 259 }],
    subtotal: 259, discount: 0, total: 259, coupon: '', paymentMethod: 'bKash',
    paymentStatus: 'Paid', orderStatus: 'Completed', trxId: 'DEMO-TRX-1', createdAt: nowStr(),
  },
];

export const SEED_PURCHASES = [
  { id: 'pu-seed1', userId: 'u-demo', productId: 'p3', orderId: 'MG-100001', accessStatus: 'active' as const, purchasedAt: nowStr() },
];
