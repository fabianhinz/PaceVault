import path from 'node:path';
import { defineConfig } from 'vite-plus';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@tests': path.resolve(__dirname, 'tests'),
      '@testUtils': path.resolve(__dirname, 'tests/testUtils'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
    include: ['tests/**/*.spec.{ts,tsx}'],
    globals: true,
    clearMocks: true,
    coverage: {
      provider: 'v8',
      include: ['src/store/**/*.ts', 'src/lib/**/*.{ts,tsx}'],
    },
  },
});
