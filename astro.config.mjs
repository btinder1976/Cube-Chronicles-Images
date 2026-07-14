// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

const SITE_URL = process.env.SITE_URL || 'https://cubechronicles.com';

// Astro on Cloudflare (Pages/Workers). Static content pages are prerendered;
// dynamic routes (auth, community Q&A, admin, API) run on the Cloudflare runtime.
export default defineConfig({
  site: SITE_URL,
  output: 'server',
  adapter: cloudflare({
    platformProxy: { enabled: true },
    imageService: 'compile',
  }),
  trailingSlash: 'ignore',
  build: {
    inlineStylesheets: 'auto',
  },
  vite: {
    build: {
      cssMinify: true,
    },
  },
});
