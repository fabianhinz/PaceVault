import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite-plus';

// Serves the banner page (banner/page/) and the raw tiles in banner/out/ for the capture, with the
// app's public folder for the favicon.
export default defineConfig({
  publicDir: resolve(import.meta.dirname, '../../apps/web/public'),
  plugins: [react(), tailwindcss()],
});
