import { fileURLToPath } from 'node:url';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import { i18nPlugin } from '@pacevault/i18n/vite.ts';
import { workbenchFiles } from './src/lib/devPlugin.ts';

// The backlog the board reads: WB_ROOT (a fixture folder in tests) or tools/workbench/backlog.
const root = process.env.WB_ROOT ?? fileURLToPath(new URL('../backlog', import.meta.url));
// tools/workbench/GUIDE.md, outside the backlog (its own path, also with WB_ROOT).
const guideFile = fileURLToPath(new URL('../GUIDE.md', import.meta.url));

export default defineConfig({
  server: { port: 4321 },
  devToolbar: { enabled: false },
  integrations: [react()],
  vite: {
    plugins: [tailwindcss(), i18nPlugin(), workbenchFiles({ root, guideFile })],
    // tech.ts imports these lazily; pre-bundle them at startup so Vite never re-optimizes
    // mid-session (that leaves the open page with "504 Outdated Optimize Dep" for mermaid).
    optimizeDeps: { include: ['mermaid', '@mermaid-js/layout-elk'] },
  },
});
