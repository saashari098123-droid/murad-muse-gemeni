import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const siteUrl = (process.env.VITE_SITE_URL || 'https://murad-muse-gemeni.onrender.com').replace(/\/$/, '');

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'site-url-html',
      transformIndexHtml: {
        order: 'post',
        handler: (html) => html.replaceAll('__SITE_URL__', siteUrl),
      },
    },
  ],
  define: { __SITE_URL__: JSON.stringify(siteUrl) },
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
});
