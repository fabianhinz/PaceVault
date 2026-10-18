import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import sirv from 'sirv';

// The workbench the board reads: WB_ROOT (a fixture folder in tests) or the folder above.
const root = process.env.WB_ROOT ?? fileURLToPath(new URL('..', import.meta.url));
// Mockup and review pages stay standalone HTML, served unchanged; _shared always comes from
// the real workbench/ (Astro refuses `publicDir: '..'`).
const features = sirv(root, { dev: true });
const shared = sirv(fileURLToPath(new URL('..', import.meta.url)), { dev: true });
const ARTIFACT = /^\/[a-z0-9-]+\/(mockup|review)\//;

export default defineConfig({
  server: { port: 4321 },
  devToolbar: { enabled: false },
  markdown: {
    shikiConfig: { theme: 'github-dark' },
    syntaxHighlight: { type: 'shiki', excludeLangs: ['mermaid'] },
  },
  vite: {
    plugins: [
      {
        name: 'workbench-files',
        configureServer: (server) => {
          server.middlewares.use((req, res, next) => {
            const url = req.url ?? '';
            if (url.startsWith('/_shared/')) return shared(req, res, next);
            if (ARTIFACT.test(url)) return features(req, res, next);
            return next();
          });
        },
      },
    ],
  },
});
