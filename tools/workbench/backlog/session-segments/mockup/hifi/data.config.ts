import { resolve } from 'node:path';
import { defineConfig } from 'vite-plus';

const REPO = resolve(import.meta.dirname, '../../../../../..');

export default defineConfig({
  resolve: {
    alias: {
      '@/': `${REPO}/apps/web/src/`,
      '@pacevault/engine/': `${REPO}/packages/engine/src/`,
      '@pacevault/gpx/': `${REPO}/packages/gpx/src/`,
    },
  },
  ssr: { noExternal: true },
  build: {
    ssr: resolve(import.meta.dirname, 'buildData.ts'),
    outDir: resolve(import.meta.dirname, '.data'),
    emptyOutDir: true,
    minify: false,
  },
});
