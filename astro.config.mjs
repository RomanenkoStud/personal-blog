// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';
import { execSync } from 'node:child_process';

// Captured at build time; the Cloudflare runtime has no git.
let lastTended = { date: new Date().toISOString().slice(0, 10), hash: '' };
try {
  const [hash, date] = execSync('git log -1 --format=%h%x09%as', { encoding: 'utf8' }).trim().split('\t');
  lastTended = { date, hash };
} catch {}

export default defineConfig({
  site: 'https://pavloromanenko.com',
  output: 'server',
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
  vite: {
    plugins: [tailwindcss()],
    define: {
      __LAST_TENDED__: JSON.stringify(lastTended),
    },
  },
});
