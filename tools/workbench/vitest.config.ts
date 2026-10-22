import { defineConfig } from 'vite-plus';

// Tests for the scripts, hooks and the board's write-back helpers; node only, no app setup.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.spec.ts'],
    globals: true,
  },
});
