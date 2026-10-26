import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { Page } from '@playwright/test';
import { hideOverlays } from './appPage.ts';
import type { Clip } from './clip.ts';
import { REPO_ROOT, bannerLocale } from './env.ts';
import { cropPng } from './png.ts';
import { waitForStill } from './stillness.ts';

const LOCALE = bannerLocale();
const OUT_DIR = resolve(import.meta.dirname, 'out', LOCALE);
export const BANNER_PATH = resolve(REPO_ROOT, 'docs/banners', `${LOCALE}_banner.png`);
mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(dirname(BANNER_PATH), { recursive: true });

const outPath = (file: string) => resolve(OUT_DIR, file);

export const shoot = async ({ file, clip }: { file: string; clip?: Clip }, page: Page) => {
  await hideOverlays(page);
  await waitForStill(page);
  const png = await page.screenshot();
  if (clip) {
    writeFileSync(outPath(file), await cropPng({ png, cssClip: clip }, page));
    return;
  }
  writeFileSync(outPath(file), png);
};
