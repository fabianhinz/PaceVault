import path from 'node:path';
import { defineConfig } from 'vite-plus';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@tests': path.resolve(__dirname, 'tests'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
    include: ['tests/**/*.integration.test.ts', 'tests/**/*.spec.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['src/store/**/*.ts', 'src/lib/**/*.{ts,tsx}'],
    },
  },
});
