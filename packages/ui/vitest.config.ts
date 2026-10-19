import { defineConfig } from 'vite-plus';

// Kit helpers and hooks: jsdom for the DOM-facing code, no app setup file.
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.spec.ts'],
    globals: true,
  },
});
