import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import vm from 'node:vm';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(here, '../../../../../../../apps/web/package.json'));
const { chromium } = require('@playwright/test');

const context = { window: {} };
vm.runInNewContext(readFileSync(join(here, 'data.js'), 'utf8'), context);
const scenes = context.window.SCENES;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1660, height: 800 } });
for (const scene of scenes) {
  await page.goto(pathToFileURL(join(here, 'page.html')).href + '#' + scene.id);
  await page.reload();
  await page.waitForSelector('body[data-ready="1"]');
  await page.waitForFunction(() => [...document.images].every((img) => img.complete), null, {
    timeout: 5000,
  });
  const ok = await page.evaluate(() => [...document.images].every((img) => img.naturalWidth > 0));
  if (!ok) throw new Error('image failed: ' + scene.id);
  await page.screenshot({ path: join(here, '..', scene.file) });
  console.log('rendered', scene.file);
}
await browser.close();
