import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite-plus';

export default defineConfig({
  publicDir: resolve(import.meta.dirname, '../../apps/web/public'),
  plugins: [react(), tailwindcss()],
});
