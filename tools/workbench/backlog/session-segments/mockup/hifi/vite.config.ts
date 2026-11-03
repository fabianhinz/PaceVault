import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { defineConfig, type Plugin } from 'vite-plus';
import { entryLabel, entryPasses } from './entries.ts';

const HERE = import.meta.dirname;
const REPO = resolve(HERE, '../../../../../..');
const fromWeb = createRequire(resolve(REPO, 'apps/web/package.json'));
const packageDir = (name: string) => dirname(fromWeb.resolve(`${name}/package.json`));

const importFromWeb = async (name: string) => import(pathToFileURL(fromWeb.resolve(name)).href);

// file:// cannot load module scripts from other files, so the page ships as one HTML file.
const inlineEverything = (): Plugin => ({
  name: 'hifi-inline-everything',
  enforce: 'post',
  generateBundle(_options, bundle) {
    const html = Object.values(bundle).find((item) => item.fileName === 'index.html');
    if (html === undefined || html.type !== 'asset') return;
    let source = String(html.source);
    for (const item of Object.values(bundle)) {
      if (item.type === 'chunk') {
        const code = item.code.replaceAll('</script', '<\\/script');
        source = source.replace(new RegExp(`<script[^>]*src="[^"]*${item.fileName}"[^>]*></script>`), () => `<script type="module">${code}</script>`);
        delete bundle[item.fileName];
      }
      if (item.type === 'asset' && item.fileName.endsWith('.css')) {
        source = source.replace(new RegExp(`<link[^>]*href="[^"]*${item.fileName}"[^>]*>`), () => `<style>${String(item.source)}</style>`);
        delete bundle[item.fileName];
      }
    }
    html.source = source;
  },
});

const TYPE_LABEL: Record<string, string> = { climb: 'Climb', flat: 'Flat', descent: 'Descent', route: 'Route' };

const kilometres = (meters: number) => {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
};

// The shell page reads the segment list as a classic script, which also loads over file://.
const segmentIndex = (): Plugin => ({
  name: 'hifi-segment-index',
  generateBundle() {
    const data = JSON.parse(readFileSync(resolve(HERE, 'segments.json'), 'utf8'));
    const index: Record<string, Array<{ id: string; label: string; from: Array<{ id: string; label: string }> }>> = {};
    for (const sport of Object.keys(data.sports)) {
      index[sport] = data.sports[sport].segments.map((segment: { id: string; type: string; typeNumber: number; distanceMeters: number; passes: Array<{ sessionId: string; seconds: number; date: number }> }) => ({
        id: segment.id,
        label: `${TYPE_LABEL[segment.type]} ${segment.typeNumber} · ${kilometres(segment.distanceMeters)} · ${segment.passes.length}`,
        from: entryPasses(segment.passes).map((entry) => ({ id: entry.pass.sessionId, label: entryLabel({ date: entry.pass.date, role: entry.role }) })),
      }));
    }
    this.emitFile({ type: 'asset', fileName: 'segments-index.js', source: `window.HIFI_SEGMENTS = ${JSON.stringify(index)};\n` });
  },
});

export default defineConfig(async () => {
  const react = (await importFromWeb('@vitejs/plugin-react')).default;
  const tailwindcss = (await importFromWeb('@tailwindcss/vite')).default;
  return {
    root: HERE,
    base: './',
    plugins: [react(), tailwindcss(), inlineEverything(), segmentIndex()],
    resolve: {
      alias: [
        { find: /^@pacevault\/ui\/(.*)$/, replacement: `${REPO}/packages/ui/src/$1` },
        { find: /^@pacevault\/engine\/(.*)$/, replacement: `${REPO}/packages/engine/src/$1` },
        { find: /^react$/, replacement: `${packageDir('react')}/index.js` },
        { find: /^react\/(.*)$/, replacement: `${packageDir('react')}/$1` },
        { find: /^react-dom$/, replacement: `${packageDir('react-dom')}/index.js` },
        { find: /^react-dom\/(.*)$/, replacement: `${packageDir('react-dom')}/$1` },
        { find: /^recharts$/, replacement: packageDir('recharts') },
        { find: /^lucide-react$/, replacement: packageDir('lucide-react') },
      ],
      dedupe: ['react', 'react-dom'],
    },
    json: { stringify: true },
    build: {
      outDir: resolve(HERE, 'dist'),
      emptyOutDir: true,
      assetsInlineLimit: Number.MAX_SAFE_INTEGER,
      cssCodeSplit: false,
      modulePreload: false,
      rollupOptions: { output: { codeSplitting: false } },
    },
  };
});
