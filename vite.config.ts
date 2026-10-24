import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // GitHub Pages serves the site from /<repo>/, so asset URLs must carry that
  // prefix. Cloudflare and the local dev server stay at the root, so the base is
  // only applied when the build is meant for Pages.
  base: process.env.GITHUB_PAGES === 'true' ? '/FAU-Studyinfo-Navigator/' : '/',
  plugins: [react(), tailwindcss()],
  server: {
    host: '127.0.0.1',
  },
  preview: {
    host: '127.0.0.1',
  },
  build: {
    // Shipping everything as one chunk tripped the 500 kB warning. Splitting the
    // runtime libraries keeps the application code small and lets a data-only
    // release reuse the vendor chunks from the browser cache.
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) return 'react-vendor';
          if (id.includes('node_modules/zod')) return 'schema-vendor';
          return undefined;
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    clearMocks: true,
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules/**', 'dist/**', 'tests/**'],
  },
});
