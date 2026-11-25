import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Plain Vite config on purpose: unit tests cover pure modules and must not boot the
// Astro/Cloudflare toolchain.
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
