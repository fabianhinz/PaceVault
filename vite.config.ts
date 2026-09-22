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
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { SURFACE_BASE } from './src/lib/colors.ts';

export default defineConfig({
  fmt: {
    semi: true,
    singleQuote: true,
    trailingComma: 'all',
    printWidth: 100,
    tabWidth: 2,
    arrowParens: 'always',
    endOfLine: 'lf',
  },
  lint: {
    plugins: ['oxc', 'typescript', 'unicorn', 'react'],
    categories: {
      correctness: 'warn',
    },
    rules: {
      'typescript/no-floating-promises': 'off',
      '@typescript-eslint/no-non-null-assertion': 'error',
    },
    ignorePatterns: ['dist', '**/paraglide', 'project.inlang', 'e2e'],
    overrides: [
      {
        files: ['**/*.{ts,tsx}'],
        rules: {
          'no-unused-vars': [
            'error',
            {
              argsIgnorePattern: '^_',
              varsIgnorePattern: '^_',
              destructuredArrayIgnorePattern: '^_',
              caughtErrorsIgnorePattern: '^_',
            },
          ],
          'react-hooks/rules-of-hooks': 'error',
          'react-hooks/exhaustive-deps': 'warn',
          'react/only-export-components': [
            'error',
            {
              allowConstantExport: true,
            },
          ],
          '@typescript-eslint/no-explicit-any': 'error',
        },
        env: {
          es2022: true,
          browser: true,
        },
      },
    ],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, 'src'),
    },
  },
  plugins: [
    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './src/paraglide',
      strategy: ['localStorage', 'preferredLanguage', 'baseLocale'],
    }),
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
