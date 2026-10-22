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
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    clearMocks: true,
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules/**', 'dist/**', 'tests/**'],
  },
});
