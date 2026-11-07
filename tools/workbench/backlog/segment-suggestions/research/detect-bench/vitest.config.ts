import path from 'node:path';
import { defineConfig } from 'vite-plus';

const ROOT = path.resolve(__dirname, '../../../../../..');
const WEB = path.join(ROOT, 'apps/web');

export default defineConfig({
  root: __dirname,
  resolve: {
    alias: {
      '@pacevault/engine': path.join(ROOT, 'packages/engine/src'),
      '@pacevault/gpx': path.join(ROOT, 'packages/gpx/src'),
      '@': path.join(WEB, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['*.bench.ts'],
    testTimeout: 30 * 60 * 1000,
  },
});
