/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, type Locator, type Page } from '@playwright/test';
import { z } from 'zod';
import { openMeteoFixture } from '@pacevault/web/e2e/openMeteo';
import { ISAR_800S, STARNBERGER_LONG_RIDE, TEGERNSEE_LOOP } from '@pacevault/web/demo/schedule';
import { BANNER_ORIGIN, README_ORIGIN, readmeLocale } from './env.ts';
import { BANNER_TEXT, FILTER_READINGS } from './tiles.ts';

const LOCALE = readmeLocale();
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '../../..');
const OUT_DIR = resolve(scriptDir, 'out', LOCALE);
const BANNER_PATH = resolve(repoRoot, 'docs/banners', `${LOCALE}_banner.png`);
mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(dirname(BANNER_PATH), { recursive: true });

const messages = z
  .record(z.string(), z.unknown())
  .parse(
    JSON.parse(readFileSync(resolve(repoRoot, 'packages/i18n/messages', `${LOCALE}.json`), 'utf8')),
  );
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

const ANCHOR = new Date('2026-09-16T12:00:00+02:00');
const DESKTOP = { width: 1440, height: 900 };
const HERO = { width: 1440, height: 1520 };
const MOBILE = { width: 390, height: 844 };
const MAP_WIDTH = DESKTOP.width * 0.6;
const STILL_POLL_MS = 500;
const STILL_MAX_POLLS = 60;
const NETWORK_IDLE_MS = 10_000;

const LAPS_SESSION = ISAR_800S;
const STATS_SHEET_POSITION = 0.8;
const WEATHER_SESSION = 'Dachau loop';
const LOCATE_POSITION = { latitude: 48.10131, longitude: 11.54668, accuracy: 5 };
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

const loadDemoData = async (page: Page) => {
  await page.goto('/');
  await page
    .getByRole('button', { name: t('ui_onboarding_demo_title'), exact: true })
    .click({ timeout: 15_000 });
  const summary = page.getByTestId('import-summary');
  await expect(summary).toBeVisible({ timeout: 60_000 });
  await summary
    .getByRole('button', { name: new RegExp(escapeRegExp(t('ui_import_close')), 'i') })
    .click();
  await expect(page.locator('[data-layout="dock"]')).toBeVisible({ timeout: 30_000 });
};

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

const parkMouse = async (page: Page) => {
  const viewport = page.viewportSize();
  if (!viewport) return;
  await page.mouse.move(2, viewport.height - 2);
};

// Always compares whole-window shots: a `clip` screenshot in headless Chromium re-renders
// the page for the capture and drops `backdrop-filter`, so glass cards show crisp map
// streets through them — something the app never paints.
// `networkidle` is only a head start: in dev, StrictMode terminates the first GPS worker
// while its module imports are in flight, and Playwright keeps those requests pending
// forever. The frame comparison below is the real check.
const waitForStill = async (page: Page) => {
  await page.waitForLoadState('networkidle', { timeout: NETWORK_IDLE_MS }).catch(() => undefined);
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

const openSession = async (page: Page, name: string) => {
  await page.goto('/sessions');
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

const padded = (box: Clip, padding: number): Clip => ({
  x: box.x - padding,
  y: box.y - padding,
  width: box.width + padding * 2,
  height: box.height + padding * 2,
});

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const isOverTrack = (page: Page, point: { x: number; y: number }) =>
  page.evaluate(async (p) => {
    for (let frame = 0; frame < 4; frame++) {
      await new Promise((done) => requestAnimationFrame(done));
    }
    const element = document.elementFromPoint(p.x, p.y);
    return element !== null && getComputedStyle(element).cursor === 'pointer';
  }, point);

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

const nextTrackPoint = async (page: Page, points: { x: number; y: number }[], from: number) => {
  for (let i = from; i < points.length; i++) {
    const point = points[i];
    if (!point) break;
    await page.mouse.move(point.x, point.y);
    if (await isOverTrack(page, point)) return i;
  }
  return -1;
};

const popover = (page: Page) =>
  page.locator('[data-radix-popper-content-wrapper]').getByRole('dialog');

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

const locate = async (page: Page) => {
  await page.getByRole('button', { name: t('ui_dock_locate_me') }).click();
  await waitForStill(page);
  return findPositionDot(page);
};

const sheet = (page: Page) => page.locator('[data-sheet-position]');

const sheetHandle = (page: Page) => sheet(page).locator('[data-sheet-handle]');

const sheetScroller = (page: Page) => page.locator('[data-layout="main"]').locator('..');

type LayoutStoreModule = typeof import('@pacevault/web/store/layout');

const pinSheetPosition = (page: Page, position: number) =>
  page.evaluate(
    async (input) => {
      const layout: LayoutStoreModule = await import(input.module);
      layout.useLayoutStore.getState().setMobileSheetPosition(input.position);
    },
    { module: '/src/store/layout.ts', position },
  );

const contains = (outer: Clip, inner: Clip) =>
  inner.x >= outer.x &&
  inner.y >= outer.y &&
  inner.x + inner.width <= outer.x + outer.width &&
  inner.y + inner.height <= outer.y + outer.height;

test.describe.configure({ mode: 'serial' });

test.describe('flow 1', () => {
  test.use({ viewport: HERO });

  test('1 interactive heatmap', async ({ page }) => {
    await prepareContext(page);
    await page.context().grantPermissions(['geolocation'], { origin: README_ORIGIN });
    await page.context().setGeolocation(LOCATE_POSITION);
    await loadDemoData(page);
    await page.goto('/');
    await hideOverlays(page);
    await parkMouse(page);
    await waitForStill(page);

    await locate(page);
    await page.locator('.maplibregl-canvas').focus();
    await page.keyboard.press('=');
    await hideOverlays(page);
    await waitForStill(page);
    const dot = await findPositionDot(page);
    const x = clamp(dot.x - 70, 0, MAP_WIDTH - 480);
    const y = clamp(dot.y - 280, 0, HERO.height - 970);
    const frame1Clip = { x, y, width: 480, height: 970 };
    const frame2Clip = { x, y, width: 480, height: 695 };

    await page.mouse.move(dot.x, dot.y);
    expect(await isOverTrack(page, dot)).toBe(true);
    await shoot(page, '1a-heatmap-locate.png', frame1Clip);

    await page.mouse.click(dot.x, dot.y);
    const pick = popover(page);
    await expect(pick).toBeVisible();
    await expect.poll(() => pick.getByTestId('session-item').count()).toBeGreaterThan(2);
    await expect(pick.locator('.text-sport-running').first()).toBeVisible();
    await expect(pick.locator('.text-sport-cycling').first()).toBeVisible();
    await waitForStill(page);
    const pickBox = await boxOf(pick);
    if (!contains(frame2Clip, pickBox)) {
      throw new Error(
        `pick popover ${JSON.stringify(pickBox)} lies outside frame 2 ${JSON.stringify(frame2Clip)}`,
      );
    }
    await parkMouse(page);
    await shoot(page, '1b-heatmap-pick.png', frame2Clip);

    await pick.getByTestId('session-item').first().click();
    await page.waitForURL(/\/sessions\/.+/);
    await page.getByRole('button', { name: t('ui_session_actions') }).click();
    const menu = page.getByRole('menu');
    await expect(menu.getByRole('menuitem', { name: t('ui_btn_export_gpx') })).toBeVisible();
    await parkMouse(page);
    await hideOverlays(page);
    await waitForStill(page);
    await shoot(page, '1b-heatmap-export.png', padded(await boxOf(menu), 8));
  });
});

test.describe('flow 2', () => {
  test.use({ viewport: MOBILE, isMobile: true, hasTouch: true });

  test('laps in color', async ({ page }) => {
    await prepareContext(page);
    await loadDemoData(page);
    await openSession(page, LAPS_SESSION);

    await page.getByTestId('laps-pill').click();
    const device = page.getByRole('radio', {
      name: new RegExp('^' + escapeRegExp(t('ui_laps_device'))),
    });
    await device.click();
    await expect(device).toBeHidden();

    await page.getByTestId('color-by-pill').click();
    await page.getByRole('dialog').getByText(t('ui_color_by_hr'), { exact: true }).click();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await expect(sheet(page)).toHaveAttribute('data-sheet-position', '0.50');
    await sheetHandle(page).click();
    await expect(sheet(page)).toHaveAttribute('data-sheet-position', '1.00');
    await sheetHandle(page).click();
    await expect(sheet(page)).toHaveAttribute('data-sheet-position', '0.00');
    await parkMouse(page);
    await shoot(page, '2a-laps-hr.png');

    const mapBottom = (await boxOf(sheetHandle(page))).y - 12;
    const points = spiral({ x: MOBILE.width / 2, y: mapBottom / 2 }, 12, mapBottom / 2).filter(
      (point) => point.x > 8 && point.x < MOBILE.width - 8 && point.y > 8 && point.y < mapBottom,
    );
    const stepper = page.getByTestId('lap-stepper');
    const stepperName = page.getByTestId('lap-stepper-name');
    let repName: string | null = null;
    let from = 0;
    while (repName === null) {
      const found = await nextTrackPoint(page, points, from);
      const point = points[found];
      if (found < 0 || !point) break;
      await page.touchscreen.tap(point.x, point.y);
      await expect(stepper).toBeVisible();
      const resting = await stepperName.evaluate((el) =>
        el.classList.contains('text-text-tertiary'),
      );
      if (!resting) {
        repName = await stepperName.textContent();
        break;
      }
      await page.getByTestId('lap-stepper-clear').click();
      await expect(stepper).toBeHidden();
      await waitForStill(page);
      from = found + 1;
    }
    if (repName === null) throw new Error('no 800 m rep found on the map');
    await parkMouse(page);
    await shoot(page, '2b-laps-tap.png');

    await pinSheetPosition(page, STATS_SHEET_POSITION);
    await expect(sheet(page)).toHaveAttribute(
      'data-sheet-position',
      STATS_SHEET_POSITION.toFixed(2),
    );
    await page.getByTestId('lap-stepper-prev').click();
    await page.getByTestId('lap-stepper-next').click();
    await expect(stepperName).toHaveText(repName);
    await waitForStill(page);

    const hrChart = page.getByRole('region', { name: t('ui_chart_title_hr'), exact: true });
    const handleBox = await boxOf(sheetHandle(page));
    const scrollTarget = handleBox.y + handleBox.height + 8;
    const offset = (await boxOf(hrChart)).y - scrollTarget;
    await sheetScroller(page).evaluate((el, by) => el.scrollBy(0, by), offset);
    await waitForStill(page);
    expect(Math.abs((await boxOf(hrChart)).y - scrollTarget)).toBeLessThanOrEqual(1);
    const summary = await boxOf(page.getByTestId('session-summary'));
    if (summary.y + summary.height > handleBox.y + handleBox.height) {
      throw new Error(`summary card ${JSON.stringify(summary)} still shows in the sheet`);
    }
    await expect(hrChart.getByTestId('lap-band-selected')).toBeAttached();
    await expect(stepperName).toHaveText(repName);
    await parkMouse(page);
    await shoot(page, '2c-laps-stats.png');
  });
});

test.describe('desktop tiles', () => {
  test.use({ viewport: DESKTOP });

  test.beforeEach(async ({ page }) => {
    await prepareContext(page);
    await loadDemoData(page);
  });

  test('route studio', async ({ page }) => {
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
    const studio = popover(page);
    await expect(studio).toContainText(t('ui_studio_pick_title'));
    await expect(studio.getByRole('button', { name: t('ui_studio_export_segment') })).toBeEnabled();

    await waitForStill(page);
    await shoot(page, 'studio.png', padded(await boxOf(studio), 8));
  });

  test('splits', async ({ page }) => {
    await openSession(page, STARNBERGER_LONG_RIDE);
    await page.getByTestId('laps-pill').click();
    const slider = page.getByRole('slider', { name: t('ui_laps_split_distance') });
    await slider.focus();
    for (let step = 0; step < 5; step++) {
      await page.keyboard.press('ArrowRight');
    }
    await expect(page.getByTestId('split-distance-value')).toHaveText(/^10\s*km$/);
    await parkMouse(page);
    await waitForStill(page);
    await shoot(page, 'splits.png', padded(await boxOf(popover(page)), 8));
  });

  test('plain-text filters', async ({ page }) => {
    await page.goto('/');
    await hideOverlays(page);
    await page.getByRole('button', { name: t('ui_dock_filter') }).click();
    await page.getByRole('textbox').fill(BANNER_TEXT[LOCALE].typedFilter);
    const tiles = page.getByTestId('filter-builder-tiles');
    await expect(tiles.getByRole('button')).toHaveCount(FILTER_READINGS);
    await parkMouse(page);
    await waitForStill(page);
    const card = await boxOf(page.locator('[data-dock-card]'));
    const readings = await boxOf(tiles);
    await shoot(page, 'filter.png', {
      x: card.x,
      y: card.y,
      width: card.width,
      height: readings.y + readings.height + 12 - card.y,
    });
  });
});

test.describe('mobile tiles', () => {
  test.use({ viewport: MOBILE, isMobile: true, hasTouch: true });

  test('summary card and hourly weather', async ({ page }) => {
    await prepareContext(page);
    await loadDemoData(page);
    await openSession(page, WEATHER_SESSION);
    await hideOverlays(page);
    const weather = page.getByTestId('weather-card');
    await expect(weather).toContainText('°C', { timeout: 15_000 });
    await sheetHandle(page).click();
    await expect(sheet(page)).toHaveAttribute('data-sheet-position', '1.00');
    const summary = page.getByTestId('session-summary');
    await expect(summary.locator('[aria-expanded="true"]')).toHaveCount(0);
    await summary.scrollIntoViewIfNeeded();
    await parkMouse(page);
    await waitForStill(page);
    await shoot(page, 'summary.png', padded(await boxOf(summary), 8));

    const header = weather.getByRole('button').first();

    await header.click();
    await weather.scrollIntoViewIfNeeded();
    await parkMouse(page);
    await waitForStill(page);
    const card = await boxOf(weather);
    const headerBox = await boxOf(header);
    const top = headerBox.y + headerBox.height;
    if (card.y + card.height > MOBILE.height) {
      throw new Error(
        `weather details ${JSON.stringify(card)} run past the bottom of the viewport`,
      );
    }
    await shoot(page, 'weather-details.png', {
      x: card.x,
      y: top,
      width: card.width,
      height: card.y + card.height - top,
    });
  });
});

test.describe('banner', () => {
  test.use({ viewport: { width: 1600, height: 1180 } });

  test('render banner', async ({ page }) => {
    await page.goto(`${BANNER_ORIGIN}/banner/page/index.html?locale=${LOCALE}`);
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
    expect(await boxOf(banner)).toEqual({ x: 0, y: 0, width: 1600, height: 1180 });
    await waitForStill(page);
    await page.screenshot({ path: BANNER_PATH });
  });
});
