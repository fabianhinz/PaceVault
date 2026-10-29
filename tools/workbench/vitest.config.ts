import path from 'node:path';
import { defineConfig } from 'vite-plus';

export default defineConfig({
  resolve: {
    alias: {
      '@scripts': path.resolve(__dirname, 'scripts'),
      '@site': path.resolve(__dirname, 'site/src'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.spec.ts'],
    globals: true,
  },
});
