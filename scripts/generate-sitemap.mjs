import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const source = fs.readFileSync(path.join(root, 'src/store.ts'), 'utf8');
const siteUrl = (process.env.VITE_SITE_URL || 'https://murad-muse-gemeni.onrender.com').replace(/\/$/, '');
const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9\u0980-\u09FF]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
const products = [...source.matchAll(/P\('([^']+)',\s*'([^']+)'/g)].map(([, id, name]) => `${slugify(name)}-${id}`);
const urls = [
  { loc: '/', changefreq: 'daily', priority: '1.0' },
  { loc: '/products', changefreq: 'daily', priority: '0.9' },
  ...products.map((slug) => ({ loc: `/product/${slug}`, changefreq: 'weekly', priority: '0.8' })),
];
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(({ loc, changefreq, priority }) => `  <url><loc>${siteUrl}${loc}</loc><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`).join('\n')}\n</urlset>\n`;
fs.mkdirSync(path.join(root, 'public'), { recursive: true });
fs.writeFileSync(path.join(root, 'public/sitemap.xml'), xml);
fs.writeFileSync(path.join(root, 'public/robots.txt'), `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /dashboard\nDisallow: /checkout\nDisallow: /orders\nDisallow: /purchases\nSitemap: ${siteUrl}/sitemap.xml\n`);
console.log(`Generated sitemap for ${siteUrl} with ${urls.length} URLs`);
