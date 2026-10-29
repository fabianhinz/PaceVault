import { defineConfig } from 'vite-plus';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.spec.ts'],
    globals: true,
    restoreMocks: true,
  },
});
