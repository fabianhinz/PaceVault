import { defineConfig } from 'vite-plus';

// Pure functions: no DOM, no app setup file. A test that needs a fixed date sets it itself.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.spec.ts'],
    globals: true,
  },
});
