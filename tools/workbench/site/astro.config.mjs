import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import { i18nPlugin } from '@pacevault/i18n/vite.ts';
import { backlogRoot, GUIDE_FILE } from '../scripts/paths.ts';
import { workbenchFiles } from './src/lib/devPlugin.ts';

export default defineConfig({
  server: { port: 4321 },
  devToolbar: { enabled: false },
  integrations: [react()],
  vite: {
    plugins: [
      tailwindcss(),
      i18nPlugin(),
      workbenchFiles({ root: backlogRoot(), guideFile: GUIDE_FILE }),
    ],
    // tech.ts imports these lazily; pre-bundle them at startup so Vite never re-optimizes
    // mid-session (that leaves the open page with "504 Outdated Optimize Dep" for mermaid).
    optimizeDeps: { include: ['mermaid', '@mermaid-js/layout-elk'] },
  },
});
