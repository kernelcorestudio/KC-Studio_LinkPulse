import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SPA_EXACT = new Set([
  '',
  '/',
  '/app',
  '/login',
  '/register',
  '/dashboard',
  '/links',
  '/create',
  '/campaigns',
  '/tags',
  '/folders',
  '/import',
  '/bio',
  '/admin',
  '/settings',
]);

const SPA_PREFIXES = [
  '/app/',
  '/links/',
  '/campaigns/',
  '/tags/',
  '/folders/',
  '/admin/',
  '/src/',
  '/@',
  '/node_modules/',
];

function isSpaOrAsset(url) {
  const pathname = (url || '').split('?')[0];

  // Root or exact SPA pages
  if (SPA_EXACT.has(pathname)) return true;

  // SPA sub-routes or Vite internal assets
  if (SPA_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;

  // Static assets with file extensions (e.g. .ico, .png, .css, .js, .svg, .mp4, .webp)
  if (/\.[a-zA-Z0-9]+$/.test(pathname)) return true;

  return false;
}

const BACKEND_URL = process.env.SERVER_URL || process.env.VITE_DEV_BACKEND || 'http://localhost:3001';

// Dev proxy lets the SPA call /api and follow short links on the same origin (localhost:5173).
export default defineConfig({
  envDir: path.resolve(__dirname, '..'),
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: BACKEND_URL,
        changeOrigin: true,
      },
      '^/(?!api)': {
        target: BACKEND_URL,
        changeOrigin: true,
        bypass(req) {
          if (isSpaOrAsset(req.url)) {
            return req.url;
          }
        },
      },
    },
  },
  build: { outDir: 'dist', sourcemap: false },
});

