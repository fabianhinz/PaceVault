import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { defineConfig } from 'vite-plus';

let commitSha = 'dev';
try {
  commitSha = execSync('git rev-parse --short HEAD').toString().trim();
} catch {
  /* empty */
}

process.env.VITE_APP_COMMIT = commitSha;
import { i18nPlugin } from '@pacevault/i18n/vite.ts';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { SURFACE_BASE } from '@pacevault/ui/lib/colors.ts';

export default defineConfig({
  build: {
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, 'src'),
    },
  },
  plugins: [
    i18nPlugin(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        maximumFileSizeToCacheInBytes: 4_000_000,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/tiles-[a-d]\.basemaps\.cartocdn\.com\/.*\.mvt/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'carto-tiles',
              expiration: {
                maxEntries: 5000,
                maxAgeSeconds: 60 * 60 * 24 * 30,
                purgeOnQuotaError: true,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/tiles\.basemaps\.cartocdn\.com\/(fonts|gl)\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'carto-assets',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30,
                purgeOnQuotaError: true,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: 'PaceVault',
        short_name: 'PaceVault',
        description: 'Offline-first endurance training tracker',
        theme_color: SURFACE_BASE,
        background_color: SURFACE_BASE,
        display: 'standalone',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
});
