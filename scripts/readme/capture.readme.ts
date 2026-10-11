/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, type Locator, type Page } from '@playwright/test';
import { z } from 'zod';
import { openMeteoFixture } from '../../e2e/helpers/openMeteo.ts';
import {
  FLAUCHER_EASY,
  ISAR_800S,
  STARNBERGER_LONG_RIDE,
  TEGERNSEE_LOOP,
} from '../../src/features/demo/demoSchedule.ts';
import { readmeLocale } from './env.ts';
import { BANNER_TEXT } from './tiles.ts';

/**
 * Captures the README banner tiles from the demo dataset in one locale, then renders
 * `docs/readme/<locale>_banner.png`. Run with `vp run readme:banner [--locale de|en]`.
 */

const LOCALE = readmeLocale();
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '../..');
const OUT_DIR = resolve(scriptDir, 'out', LOCALE);
const BANNER_PATH = resolve(repoRoot, 'docs/readme', `${LOCALE}_banner.png`);
mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(dirname(BANNER_PATH), { recursive: true });

/** The app's own UI strings, so every locator follows the captured locale. */
const messages = z
  .record(z.string(), z.unknown())
  .parse(JSON.parse(readFileSync(resolve(repoRoot, 'messages', `${LOCALE}.json`), 'utf8')));
const t = (key: string, params: Record<string, string> = {}) => {
  const value = messages[key];
  if (typeof value !== 'string') throw new Error(`message "${key}" is not a plain string`);
  let text = value;
  for (const [name, replacement] of Object.entries(params)) {
    text = text.replace(`{${name}}`, replacement);
  }
  return text;
};
const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Freezes "today" for the demo dataset: a Wednesday, so the last session is 1–7 days back. */
const ANCHOR = new Date('2026-09-16T12:00:00+02:00');
const PREVIEW_ORIGIN = 'http://localhost:4173';
const DESKTOP = { width: 1440, height: 900 };
/** Tile 1 is a tall hero tile; a taller window gives the popover room above and below. */
const HERO = { width: 1440, height: 1080 };
const MOBILE = { width: 390, height: 844 };
/** The desktop panel takes the right 40 % of the window; the map shows on the left. */
const MAP_WIDTH = DESKTOP.width * 0.6;
const STILL_POLL_MS = 500;
const STILL_MAX_POLLS = 60;

/**
 * Tile 2: scored over every demo GPS session by HR/power zone share along the track, the
 * intervals run spreads most evenly over all five HR zones on a compact route.
 */
const ZONES_SESSION = ISAR_800S;
/** Tile 6: the lake ride, offline; its name fits the phone header. */
const OFFLINE_SESSION = STARNBERGER_LONG_RIDE;
/** Tile 7: a loop ride, so head-, cross- and tailwind all show up; short name for the header. */
const WEATHER_SESSION = 'Dachau loop';
/**
 * Tile 1 position: a point on the Isar where the Isar long run, the Isar south runs, the
 * Wolfratshausen ride and the Starnberger See ride share the path.
 */
const LOCATE_POSITION = { latitude: 48.10131, longitude: 11.54654, accuracy: 5 };
const DEV_ORIGIN = 'http://localhost:5173';
/** The live-position dot fill (`geoDotFill` in `src/features/map/trackColors.ts`). */
const GEO_DOT_RGB: [number, number, number] = [80, 140, 255];

const out = (file: string) => resolve(OUT_DIR, file);

type Clip = { x: number; y: number; width: number; height: number };

const prepareContext = async (page: Page) => {
  await page.clock.setFixedTime(ANCHOR);
  await page.addInitScript((locale) => {
    localStorage.setItem('PARAGLIDE_LOCALE', locale);
  }, LOCALE);
  await page
    .context()
    .route('**/*open-meteo.com/**', (route) =>
      route.fulfill({ json: openMeteoFixture(new URL(route.request().url())) }),
    );
};

/** Loads the demo dataset through the onboarding "test data" tile. */
const loadDemoData = async (page: Page, origin = '') => {
  await page.goto(`${origin}/`);
  await page.getByText(t('ui_onboarding_testdata_title'), { exact: true }).click();
  await page
    .getByRole('button', { name: t('ui_onboarding_testdata_generate'), exact: true })
    .click();
  const summary = page.getByTestId('import-summary');
  await expect(summary).toBeVisible({ timeout: 60_000 });
  await summary
    .getByRole('button', { name: new RegExp(escapeRegExp(t('ui_import_close')), 'i') })
    .click();
  await expect(page.locator('[data-layout="dock"]')).toBeVisible({ timeout: 30_000 });
};

/** Hides the demo banner and the TanStack Query devtools toggle, and drops focus. */
const hideOverlays = async (page: Page) => {
  const bannerText = t('ui_demo_banner_text');
  await page.getByText(bannerText).waitFor({ state: 'attached' });
  await page.evaluate((text) => {
    for (const el of document.querySelectorAll<HTMLElement>(
      '.tsqd-open-btn-container, button.tsqd-open-btn, .tsqd-parent-container',
    )) {
      el.style.display = 'none';
    }
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (node.textContent?.trim() !== text) continue;
      const banner = node.parentElement?.closest<HTMLElement>('.mb-4');
      if (banner) banner.style.display = 'none';
    }
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  }, bannerText);
  await expect(page.getByText(bannerText)).toBeHidden();
  await expect(page.locator('button.tsqd-open-btn')).toBeHidden();
};

/** Parks the mouse over an empty map corner so no hover state leaks into a shot. */
const parkMouse = async (page: Page) => {
  const viewport = page.viewportSize();
  if (!viewport) return;
  await page.mouse.move(2, viewport.height - 2);
};

/**
 * Waits until rendering is truly done: network quiet, every finite CSS/Web animation
 * (dialog fade/slide, popover zoom) finished, a few frames painted, and then two
 * consecutive full-window frames identical (map tiles, camera moves, chart animations).
 *
 * Always compares whole-window shots: a `clip` screenshot in headless Chromium re-renders
 * the page for the capture and drops `backdrop-filter`, so glass cards show crisp map
 * streets through them — something the app never paints.
 */
const waitForStill = async (page: Page) => {
  await page.waitForLoadState('networkidle');
  await page.evaluate(async () => {
    const finite = document
      .getAnimations()
      .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity);
    await Promise.all(finite.map((animation) => animation.finished.catch(() => undefined)));
    for (let frame = 0; frame < 3; frame++) {
      await new Promise((done) => requestAnimationFrame(done));
    }
  });
  let previous: Buffer | null = null;
  for (let i = 0; i < STILL_MAX_POLLS; i++) {
    await page.waitForTimeout(STILL_POLL_MS);
    const frame = await page.screenshot({ scale: 'css' });
    if (previous && frame.equals(previous)) return;
    previous = frame;
  }
  throw new Error('the page never stopped changing');
};

/**
 * Opens a blank helper page with the PNG drawn on its only canvas, so the script needs no
 * image library and the app page is left untouched. The caller closes it.
 */
const openPngCanvas = async (page: Page, png: Buffer) => {
  const helper = await page.context().newPage();
  await helper.evaluate(async (data) => {
    const image = new Image();
    image.src = `data:image/png;base64,${data}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    canvas.getContext('2d')?.drawImage(image, 0, 0);
    document.body.append(canvas);
  }, png.toString('base64'));
  return helper;
};

/** Crops a whole-window shot to `clip` (CSS px, rounded to whole pixels). */
const cropPng = async (page: Page, png: Buffer, cssClip: Clip) => {
  const clip = {
    x: Math.round(cssClip.x),
    y: Math.round(cssClip.y),
    width: Math.round(cssClip.width),
    height: Math.round(cssClip.height),
  };
  const scale = await page.evaluate(() => window.devicePixelRatio);
  const helper = await openPngCanvas(page, png);
  try {
    const dataUrl = await helper.evaluate(
      (input) => {
        const source = document.querySelector('canvas');
        const target = document.createElement('canvas');
        target.width = Math.round(input.clip.width * input.scale);
        target.height = Math.round(input.clip.height * input.scale);
        const context = target.getContext('2d');
        if (!source || !context) throw new Error('no canvas');
        context.drawImage(
          source,
          Math.round(input.clip.x * input.scale),
          Math.round(input.clip.y * input.scale),
          target.width,
          target.height,
          0,
          0,
          target.width,
          target.height,
        );
        return target.toDataURL('image/png');
      },
      { clip, scale },
    );
    return Buffer.from(dataUrl.replace(/^data:image\/png;base64,/, ''), 'base64');
  } finally {
    await helper.close();
  }
};

/** Final shot: overlays hidden, everything settled, whole window captured, then cropped. */
const shoot = async (page: Page, file: string, clip?: Clip) => {
  await hideOverlays(page);
  await waitForStill(page);
  const png = await page.screenshot();
  if (clip) {
    writeFileSync(out(file), await cropPng(page, png, clip));
    return;
  }
  writeFileSync(out(file), png);
};

/**
 * Opens the most recent session with this name from the session list. The list is
 * virtualised, so it scrolls until the name is rendered.
 */
const openSession = async (page: Page, name: string, origin = '') => {
  await page.goto(`${origin}/sessions`);
  const items = page.getByTestId('session-item');
  const item = items.filter({ hasText: name }).first();
  await expect(items.first()).toBeVisible({ timeout: 15_000 });
  for (let i = 0; i < 200 && (await item.count()) === 0; i++) {
    await items.last().scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);
  }
  await item.click();
  await page.waitForURL(/\/sessions\/.+/);
  await expect(page.getByTestId('color-by-pill')).toBeVisible({ timeout: 15_000 });
};

const boxOf = async (locator: Locator) => {
  const box = await locator.boundingBox();
  if (!box) throw new Error('element has no box');
  return box;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/**
 * The map shows a pointer cursor only while it is over a pickable track. Hover picking
 * runs on animation frames, so the check waits a few frames rather than a fixed time.
 */
const isOverTrack = (page: Page, point: { x: number; y: number }) =>
  page.evaluate(async (p) => {
    for (let frame = 0; frame < 4; frame++) {
      await new Promise((done) => requestAnimationFrame(done));
    }
    const element = document.elementFromPoint(p.x, p.y);
    return element !== null && getComputedStyle(element).cursor === 'pointer';
  }, point);

/** Square spiral of points around a centre, nearest ring first. */
const spiral = (centre: { x: number; y: number }, step: number, maxRadius: number) => {
  const points: { x: number; y: number }[] = [centre];
  for (let r = step; r <= maxRadius; r += step) {
    for (let dx = -r; dx <= r; dx += step) {
      points.push({ x: centre.x + dx, y: centre.y - r }, { x: centre.x + dx, y: centre.y + r });
    }
    for (let dy = -r + step; dy <= r - step; dy += step) {
      points.push({ x: centre.x - r, y: centre.y + dy }, { x: centre.x + r, y: centre.y + dy });
    }
  }
  return points;
};

/** Index of the first spiral point from `from` on that sits on a track, or -1. */
const nextTrackPoint = async (page: Page, points: { x: number; y: number }[], from: number) => {
  for (let i = from; i < points.length; i++) {
    const point = points[i];
    if (!point) break;
    await page.mouse.move(point.x, point.y);
    if (await isOverTrack(page, point)) return i;
  }
  return -1;
};

const pickPopover = (page: Page) =>
  page.locator('[data-radix-popper-content-wrapper]').getByRole('dialog');

/** Screen position (CSS px) of the live-position dot, found by its fill colour. */
const findPositionDot = async (page: Page) => {
  const scale = await page.evaluate(() => window.devicePixelRatio);
  const helper = await openPngCanvas(page, await page.screenshot());
  try {
    const centre = await helper.evaluate((rgb) => {
      const canvas = document.querySelector('canvas');
      const context = canvas?.getContext('2d');
      if (!canvas || !context) throw new Error('no canvas');
      const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let sumX = 0;
      let sumY = 0;
      let count = 0;
      for (let i = 0; i < data.length; i += 4) {
        const distance =
          Math.abs((data[i] ?? 0) - rgb[0]) +
          Math.abs((data[i + 1] ?? 0) - rgb[1]) +
          Math.abs((data[i + 2] ?? 0) - rgb[2]);
        if (distance > 24) continue;
        sumX += (i / 4) % canvas.width;
        sumY += Math.floor(i / 4 / canvas.width);
        count++;
      }
      if (count === 0) return null;
      return { x: sumX / count, y: sumY / count };
    }, GEO_DOT_RGB);
    if (!centre) throw new Error('live-position dot not found on the map');
    return { x: centre.x / scale, y: centre.y / scale };
  } finally {
    await helper.close();
  }
};

/** Turns on "locate me" and waits until the camera has flown to the position dot. */
const locate = async (page: Page) => {
  await page.getByRole('button', { name: t('ui_dock_locate_me') }).click();
  await waitForStill(page);
  return findPositionDot(page);
};

test.describe.configure({ mode: 'serial' });

test.describe('hero tile', () => {
  test.use({ viewport: HERO });

  test('1 interactive heatmap', async ({ page }) => {
    await prepareContext(page);
    await page.context().grantPermissions(['geolocation'], { origin: DEV_ORIGIN });
    await page.context().setGeolocation(LOCATE_POSITION);
    await loadDemoData(page);
    await page.goto('/');
    await hideOverlays(page);
    await parkMouse(page);
    await waitForStill(page);

    // Locate me, then click the tracks under the position dot.
    const dot = await locate(page);
    await page.mouse.move(dot.x, dot.y);
    await page.mouse.click(dot.x, dot.y);
    const popover = pickPopover(page);
    await expect(popover).toBeVisible();
    await expect.poll(() => popover.getByTestId('session-item').count()).toBeGreaterThan(2);
    await expect(popover.locator('.text-sport-running').first()).toBeVisible();
    await expect(popover.locator('.text-sport-cycling').first()).toBeVisible();

    // Measure only after the popover's zoom-in has finished, or the crop shifts between runs.
    await waitForStill(page);
    const popoverBox = await boxOf(popover);
    const width = 470;
    await shoot(page, '1-heatmap.png', {
      x: clamp(popoverBox.x + popoverBox.width + 20 - width, 0, MAP_WIDTH - width),
      y: 0,
      width,
      height: HERO.height,
    });
  });
});

test.describe('desktop tiles', () => {
  test.use({ viewport: DESKTOP });

  test.beforeEach(async ({ page }) => {
    await prepareContext(page);
    await loadDemoData(page);
  });

  test('2 zones on the route', async ({ page }) => {
    await openSession(page, ZONES_SESSION);
    await page.getByTestId('color-by-pill').click();
    await page.getByRole('dialog').getByText(t('ui_color_by_hr'), { exact: true }).click();
    await page.keyboard.press('Escape');
    await parkMouse(page);
    await shoot(page, '2-zones.png', { x: 85, y: 55, width: 760, height: 700 });
  });

  test('3 filters, laps and GAP', async ({ page }) => {
    await openSession(page, FLAUCHER_EASY);
    await expect(page.getByTestId('laps-pill')).toContainText(
      t('ui_laps_pill_splits', { distance: '1' }),
    );
    const pace = page.getByRole('region', { name: t('ui_zones_tab_pace'), exact: true });
    const gap = page.getByRole('region', {
      name: t('exp_gradeAdjustedPace_friendlyName'),
      exact: true,
    });
    await gap.scrollIntoViewIfNeeded();
    await waitForStill(page);

    // Zoom past the first minute: the standing start would stretch the pace axis to 50:00/km.
    // The drag zoom occasionally misses its first pointer move, so it retries until the
    // axis no longer reaches 50:00.
    const dragZoom = async () => {
      const plot = await boxOf(gap.locator('.recharts-line-curve').first());
      const y = plot.y + plot.height / 2;
      await page.mouse.move(plot.x + plot.width * 0.03, y);
      await page.waitForTimeout(300);
      await page.mouse.down();
      await page.mouse.move(plot.x + plot.width * 0.5, y, { steps: 8 });
      await page.mouse.move(plot.x + plot.width - 3, y, { steps: 8 });
      // Let the chart register the last pointer position before releasing.
      await page.waitForTimeout(300);
      await page.mouse.move(plot.x + plot.width - 2, y);
      await page.waitForTimeout(300);
      await page.mouse.up();
      await page.waitForTimeout(500);
    };
    await expect(async () => {
      if ((await gap.textContent())?.includes('50:00')) await dragZoom();
      await expect(gap).not.toContainText('50:00', { timeout: 1000 });
    }).toPass({ timeout: 30_000 });
    await expect(page.getByTestId('zoom-reset-chip').first()).toBeVisible();

    // A click on the chart selects the lap under it: its band is framed on every chart.
    const zoomed = await boxOf(gap.locator('.recharts-surface'));
    await page.mouse.click(zoomed.x + zoomed.width * 0.55, zoomed.y + zoomed.height / 2);
    await expect(page.getByTestId('lap-band-selected').first()).toBeVisible();
    await page.waitForTimeout(500);
    await parkMouse(page);
    await expect(page.locator('.recharts-active-dot')).toHaveCount(0);
    await expect(pace).toBeAttached();

    await gap.scrollIntoViewIfNeeded();
    await waitForStill(page);
    await shoot(page, '3-gap.png', await boxOf(gap));

    // The filter, typed into the dock on the heatmap.
    await page.goto('/');
    await hideOverlays(page);
    await page.getByRole('button', { name: t('ui_dock_filter') }).click();
    await page.getByRole('textbox').fill(BANNER_TEXT[LOCALE].typedFilter);
    await expect(page.getByTestId('filter-builder-tiles').getByRole('button')).toHaveCount(3);
    await parkMouse(page);
    await waitForStill(page);
    const dock = await boxOf(page.locator('[data-layout="dock"]'));
    const card = await boxOf(page.locator('[data-dock-card]'));
    const top = Math.min(dock.y, card.y) - 16;
    await shoot(page, '3-filter.png', {
      x: 0,
      y: top,
      width: 560,
      height: Math.max(dock.y + dock.height, card.y + card.height) + 16 - top,
    });
  });

  test('4 fitness and form', async ({ page }) => {
    await page.goto('/');
    await hideOverlays(page);
    await parkMouse(page);
    await waitForStill(page);

    const formCard = page
      .getByRole('heading', { name: t('ui_dashboard_current_form') })
      .locator('xpath=ancestor::div[contains(@class, "rounded-2xl")][1]');
    const card = await boxOf(formCard);
    const gauges = await boxOf(formCard.locator('.justify-center.gap-6'));
    await shoot(page, '4-form.png', {
      x: card.x,
      y: card.y,
      width: card.width,
      height: gauges.y + gauges.height + 16 - card.y,
    });

    const performance = page.getByRole('region', { name: t('ui_metrics_chart_title') });
    await performance.scrollIntoViewIfNeeded();
    await waitForStill(page);
    await shoot(page, '4-performance.png', await boxOf(performance));
  });

  test('5 route studio', async ({ page }) => {
    await page.goto('/labs?tab=studio');
    await page.getByText(TEGERNSEE_LOOP).first().click();
    await page.waitForURL(/\/studio\/.+/);

    await page.getByRole('tab', { name: t('ui_studio_tab_tools') }).click();
    const addMarker = async (button: string, km: string, label?: string) => {
      await page.getByRole('button', { name: button }).click();
      const dialog = page.getByRole('dialog');
      if (label) await dialog.getByRole('textbox').first().fill(label);
      await dialog.getByRole('spinbutton').first().fill(km);
      await dialog.getByRole('button', { name: t('ui_btn_save') }).click();
      await expect(dialog).toBeHidden();
    };
    await addMarker(t('ui_studio_marker_add_split'), '54');
    await addMarker(t('ui_studio_marker_add_split'), '74');
    await addMarker(t('ui_studio_marker_add_waypoint'), '64', 'Tegernsee');
    // Reopen the route: the camera fits it once, with the markers already in place.
    await page.goto(page.url().split('?')[0] ?? page.url());
    await expect(page.getByRole('tab', { name: t('ui_studio_tab_overview') })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await hideOverlays(page);
    await parkMouse(page);
    await waitForStill(page);

    const points = spiral({ x: MAP_WIDTH / 2, y: DESKTOP.height / 2 }, 12, 300);
    const index = await nextTrackPoint(page, points, 0);
    const point = points[index];
    if (index < 0 || !point) throw new Error('no point on the studio route');
    await page.mouse.click(point.x, point.y);
    const popover = pickPopover(page);
    await expect(popover).toContainText(t('ui_studio_pick_title'));
    await expect(
      popover.getByRole('button', { name: t('ui_studio_export_segment') }),
    ).toBeEnabled();

    // Measure only after the popover's zoom-in has finished, or the crop shifts between runs.
    await waitForStill(page);
    const box = await boxOf(popover);
    const size = 620;
    await shoot(page, '5-studio.png', {
      x: clamp(box.x + box.width + 24 - size, 0, MAP_WIDTH - size),
      y: clamp(box.y + box.height / 2 - size / 2, 0, DESKTOP.height - size),
      width: size,
      height: size,
    });
  });
});

test.describe('mobile tiles', () => {
  test.use({ viewport: MOBILE, isMobile: true, hasTouch: true });

  test.beforeEach(async ({ page }) => {
    await prepareContext(page);
  });

  test('6 works offline', async ({ page }) => {
    const context = page.context();
    await loadDemoData(page, PREVIEW_ORIGIN);
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
    await page.reload();
    await expect
      .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
      .toBe(true);

    // Online first, so the service worker caches the tiles and the weather lands in IndexedDB.
    await openSession(page, OFFLINE_SESSION, PREVIEW_ORIGIN);
    await expect(page.getByTestId('weather-card')).toContainText('°C', { timeout: 15_000 });
    await waitForStill(page);
    expect(await page.evaluate(() => caches.has('carto-tiles'))).toBe(true);

    await context.setOffline(true);
    await context.route('**/*.cartocdn.com/**', (route) => route.abort());
    await context.route('**/*open-meteo.com/**', (route) => route.abort());
    await page.reload();
    await expect(page.getByTestId('color-by-pill')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('weather-card')).toContainText('°C', { timeout: 15_000 });
    await shoot(page, '6-offline.png');
  });

  test('7 weather and wind', async ({ page }) => {
    await loadDemoData(page);
    await openSession(page, WEATHER_SESSION);
    const weather = page.getByTestId('weather-card');
    await expect(weather).toContainText('°C', { timeout: 15_000 });
    await page.getByTestId('color-by-pill').click();
    await page.getByRole('dialog').getByText(t('ui_color_by_wind'), { exact: true }).click();
    await page.keyboard.press('Escape');
    await weather.getByRole('button').first().click();
    await shoot(page, '7-weather.png');
  });
});

test.describe('banner', () => {
  test.use({ viewport: { width: 1600, height: 900 } });

  test('render banner', async ({ page }) => {
    await page.goto(`/scripts/readme/banner/index.html?locale=${LOCALE}`);
    const banner = page.locator('#banner');
    await expect(banner).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() =>
          [...document.images].every((img) => img.complete && img.naturalWidth > 0),
        ),
      )
      .toBe(true);
    await expect(page.locator('[data-overflow]')).toHaveCount(0);
    expect(await boxOf(banner)).toEqual({ x: 0, y: 0, width: 1600, height: 900 });
    await waitForStill(page);
    await page.screenshot({ path: BANNER_PATH });
  });
});
