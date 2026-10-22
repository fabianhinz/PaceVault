import { defineConfig } from 'vite-plus';

// jsdom for DOMParser (parseGpx.ts); no app setup file.
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.spec.ts'],
    globals: true,
  },
});
