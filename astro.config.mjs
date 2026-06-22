// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import lit from '@astrojs/lit';
import node from '@astrojs/node';

export default defineConfig({
  site: 'https://pavloromanenko.com',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [lit()],
  vite: {
    plugins: [tailwindcss()],
  },
});
