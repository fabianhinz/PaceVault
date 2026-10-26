/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
import { test, expect, type Locator, type Page } from '@playwright/test';
import {
  DEMO_WORKOUTS,
  ISAR_800S,
  STARNBERGER_LONG_RIDE,
  TEGERNSEE_LOOP,
} from '@pacevault/web/demo/schedule';
import {
  UI_READY_TIMEOUT_MS,
  hideOverlays,
  isOverTrack,
  loadDemoData,
  locate,
  nextTrackPoint,
  openSession,
  parkMouse,
  pinSheetPosition,
  popover,
  prepareContext,
  sheet,
  sheetHandle,
  sheetScroller,
} from './appPage.ts';
import { boxOf, clamp, isWithin, padded, spiral, type Clip } from './clip.ts';
import { BANNER_ORIGIN, WEB_APP_ORIGIN, bannerLocale } from './env.ts';
import { BANNER_TEXT_BY_LOCALE, FILTER_READING_COUNT } from './bannerContent.ts';
import { escapeRegExp, messageText } from './messages.ts';
import { findPositionDot } from './png.ts';
import { BANNER_PATH, shoot } from './shots.ts';
import { waitForStill } from './stillness.ts';

const LOCALE = bannerLocale();

const DESKTOP_VIEWPORT = { width: 1440, height: 900 };
const HERO_VIEWPORT = { width: 1440, height: 1520 };
const MOBILE_VIEWPORT = { width: 390, height: 844 };
const MAP_WIDTH = DESKTOP_VIEWPORT.width * 0.6;

const LAPS_SESSION = ISAR_800S;
const STATS_SHEET_POSITION = 0.8;
const WEATHER_SESSION = DEMO_WORKOUTS.dachauRide.name;
const LOCATE_POSITION = { latitude: 48.10131, longitude: 11.54668, accuracy: 5 };

const HERO_FRAME_OFFSET_X = 70;
const HERO_FRAME_OFFSET_Y = 280;
const HERO_FRAME_WIDTH = 480;
const HERO_LOCATE_FRAME_HEIGHT = 970;
const HERO_PICK_FRAME_HEIGHT = 695;
const SHOT_PADDING = 8;
const SHEET_HANDLE_CLEARANCE = 12;
const SPIRAL_STEP = 12;
const STUDIO_SPIRAL_RADIUS = 300;
const MAP_EDGE_MARGIN = 8;
const CHART_SCROLL_GAP = 8;
const CHART_SCROLL_TOLERANCE = 1;
const SPLIT_SLIDER_STEPS = 5;
const FILTER_READINGS_BOTTOM_PADDING = 12;
const BANNER_VIEWPORT = { width: 1600, height: 1180 };

const openHeatmapAtLocatedPosition = async (page: Page) => {
  await prepareContext(page);
  await page.context().grantPermissions(['geolocation'], { origin: WEB_APP_ORIGIN });
  await page.context().setGeolocation(LOCATE_POSITION);
  await loadDemoData(page);
  await page.goto('/');
  await hideOverlays(page);
  await parkMouse(page);
  await waitForStill(page);
};

const zoomToPositionDot = async (page: Page) => {
  await locate(page);
  await page.locator('.maplibregl-canvas').focus();
  await page.keyboard.press('=');
  await hideOverlays(page);
  await waitForStill(page);
  return findPositionDot(page);
};

const heroFrames = (dot: { x: number; y: number }) => {
  const frameX = clamp(dot.x - HERO_FRAME_OFFSET_X, 0, MAP_WIDTH - HERO_FRAME_WIDTH);
  const frameY = clamp(
    dot.y - HERO_FRAME_OFFSET_Y,
    0,
    HERO_VIEWPORT.height - HERO_LOCATE_FRAME_HEIGHT,
  );
  const frame1Clip = {
    x: frameX,
    y: frameY,
    width: HERO_FRAME_WIDTH,
    height: HERO_LOCATE_FRAME_HEIGHT,
  };
  const frame2Clip = {
    x: frameX,
    y: frameY,
    width: HERO_FRAME_WIDTH,
    height: HERO_PICK_FRAME_HEIGHT,
  };
  return { locate: frame1Clip, pick: frame2Clip };
};

const shootLocate = async (
  { dot, clip }: { dot: { x: number; y: number }; clip: Clip },
  page: Page,
) => {
  await page.mouse.move(dot.x, dot.y);
  expect(await isOverTrack(dot, page)).toBe(true);
  await shoot({ file: '1a-heatmap-locate.png', clip }, page);
};

const shootPick = async (
  { dot, clip }: { dot: { x: number; y: number }; clip: Clip },
  page: Page,
) => {
  await page.mouse.click(dot.x, dot.y);
  const pick = popover(page);
  await expect(pick).toBeVisible();
  await expect.poll(() => pick.getByTestId('session-item').count()).toBeGreaterThan(2);
  await expect(pick.locator('.text-sport-running').first()).toBeVisible();
  await expect(pick.locator('.text-sport-cycling').first()).toBeVisible();
  await waitForStill(page);
  const pickBox = await boxOf(pick);
  if (!isWithin(clip, pickBox)) {
    throw new Error(
      `pick popover ${JSON.stringify(pickBox)} lies outside frame 2 ${JSON.stringify(clip)}`,
    );
  }
  await parkMouse(page);
  await shoot({ file: '1b-heatmap-pick.png', clip }, page);
  return pick;
};

const shootExport = async (pick: Locator, page: Page) => {
  await pick.getByTestId('session-item').first().click();
  await page.waitForURL(/\/sessions\/.+/);
  await page.getByRole('button', { name: messageText('ui_session_actions') }).click();
  const menu = page.getByRole('menu');
  await expect(
    menu.getByRole('menuitem', { name: messageText('ui_btn_export_gpx') }),
  ).toBeVisible();
  await parkMouse(page);
  await hideOverlays(page);
  await waitForStill(page);
  await shoot(
    { file: '1b-heatmap-export.png', clip: padded(await boxOf(menu), SHOT_PADDING) },
    page,
  );
};

const showDeviceLapsByHeartRate = async (page: Page) => {
  await page.getByTestId('laps-pill').click();
  const device = page.getByRole('radio', {
    name: new RegExp('^' + escapeRegExp(messageText('ui_laps_device'))),
  });
  await device.click();
  await expect(device).toBeHidden();

  await page.getByTestId('color-by-pill').click();
  await page.getByRole('dialog').getByText(messageText('ui_color_by_hr'), { exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
};

const collapseSheet = async (page: Page) => {
  await expect(sheet(page)).toHaveAttribute('data-sheet-position', '0.50');
  await sheetHandle(page).click();
  await expect(sheet(page)).toHaveAttribute('data-sheet-position', '1.00');
  await sheetHandle(page).click();
  await expect(sheet(page)).toHaveAttribute('data-sheet-position', '0.00');
};

const shootTappedRep = async (page: Page) => {
  const mapBottom = (await boxOf(sheetHandle(page))).y - SHEET_HANDLE_CLEARANCE;
  const points = spiral({
    centre: { x: MOBILE_VIEWPORT.width / 2, y: mapBottom / 2 },
    step: SPIRAL_STEP,
    maxRadius: mapBottom / 2,
  }).filter(
    (point) =>
      point.x > MAP_EDGE_MARGIN &&
      point.x < MOBILE_VIEWPORT.width - MAP_EDGE_MARGIN &&
      point.y > MAP_EDGE_MARGIN &&
      point.y < mapBottom,
  );
  const stepper = page.getByTestId('lap-stepper');
  const stepperName = page.getByTestId('lap-stepper-name');
  let repName: string | null = null;
  let from = 0;
  while (repName === null) {
    const found = await nextTrackPoint({ points, from }, page);
    const point = points[found];
    if (found < 0 || !point) break;
    await page.touchscreen.tap(point.x, point.y);
    await expect(stepper).toBeVisible();
    const resting = await stepperName.evaluate((nameElement) =>
      nameElement.classList.contains('text-text-tertiary'),
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
  await shoot({ file: '2b-laps-tap.png' }, page);
  return repName;
};

const pinSheetOnRep = async (repName: string, page: Page) => {
  const stepperName = page.getByTestId('lap-stepper-name');
  await pinSheetPosition(STATS_SHEET_POSITION, page);
  await expect(sheet(page)).toHaveAttribute('data-sheet-position', STATS_SHEET_POSITION.toFixed(2));
  await page.getByTestId('lap-stepper-prev').click();
  await page.getByTestId('lap-stepper-next').click();
  await expect(stepperName).toHaveText(repName);
  await waitForStill(page);
};

const scrollToHeartRateChart = async (repName: string, page: Page) => {
  const stepperName = page.getByTestId('lap-stepper-name');
  const hrChart = page.getByRole('region', {
    name: messageText('ui_chart_title_hr'),
    exact: true,
  });
  const handleBox = await boxOf(sheetHandle(page));
  const scrollTarget = handleBox.y + handleBox.height + CHART_SCROLL_GAP;
  const offset = (await boxOf(hrChart)).y - scrollTarget;
  await sheetScroller(page).evaluate(
    (scroller, scrollOffset) => scroller.scrollBy(0, scrollOffset),
    offset,
  );
  await waitForStill(page);
  expect(Math.abs((await boxOf(hrChart)).y - scrollTarget)).toBeLessThanOrEqual(
    CHART_SCROLL_TOLERANCE,
  );
  const summary = await boxOf(page.getByTestId('session-summary'));
  if (summary.y + summary.height > handleBox.y + handleBox.height) {
    throw new Error(`summary card ${JSON.stringify(summary)} still shows in the sheet`);
  }
  await expect(hrChart.getByTestId('lap-band-selected')).toBeAttached();
  await expect(stepperName).toHaveText(repName);
};

const shootRepStats = async (repName: string, page: Page) => {
  await pinSheetOnRep(repName, page);
  await scrollToHeartRateChart(repName, page);
  await parkMouse(page);
  await shoot({ file: '2c-laps-stats.png' }, page);
};

const addStudioMarkers = async (page: Page) => {
  await page.getByRole('tab', { name: messageText('ui_studio_tab_tools') }).click();
  const addMarker = async ({
    button,
    km,
    label,
  }: {
    button: string;
    km: string;
    label?: string;
  }) => {
    await page.getByRole('button', { name: button }).click();
    const dialog = page.getByRole('dialog');
    if (label) await dialog.getByRole('textbox').first().fill(label);
    await dialog.getByRole('spinbutton').first().fill(km);
    await dialog.getByRole('button', { name: messageText('ui_btn_save') }).click();
    await expect(dialog).toBeHidden();
  };
  await addMarker({ button: messageText('ui_studio_marker_add_split'), km: '54' });
  await addMarker({ button: messageText('ui_studio_marker_add_split'), km: '74' });
  await addMarker({
    button: messageText('ui_studio_marker_add_waypoint'),
    km: '64',
    label: 'Tegernsee',
  });
  await page.goto(page.url().split('?')[0] ?? page.url());
  await expect(
    page.getByRole('tab', { name: messageText('ui_studio_tab_overview') }),
  ).toHaveAttribute('aria-selected', 'true');
  await hideOverlays(page);
  await parkMouse(page);
  await waitForStill(page);
};

const pickStudioRoute = async (page: Page) => {
  const points = spiral({
    centre: { x: MAP_WIDTH / 2, y: DESKTOP_VIEWPORT.height / 2 },
    step: SPIRAL_STEP,
    maxRadius: STUDIO_SPIRAL_RADIUS,
  });
  const index = await nextTrackPoint({ points, from: 0 }, page);
  const point = points[index];
  if (index < 0 || !point) throw new Error('no point on the studio route');
  await page.mouse.click(point.x, point.y);
  const studio = popover(page);
  await expect(studio).toContainText(messageText('ui_studio_pick_title'));
  await expect(
    studio.getByRole('button', { name: messageText('ui_studio_export_segment') }),
  ).toBeEnabled();
  return studio;
};

const shootSummary = async (page: Page) => {
  await hideOverlays(page);
  const weather = page.getByTestId('weather-card');
  await expect(weather).toContainText('°C', { timeout: UI_READY_TIMEOUT_MS });
  await sheetHandle(page).click();
  await expect(sheet(page)).toHaveAttribute('data-sheet-position', '1.00');
  const summary = page.getByTestId('session-summary');
  await expect(summary.locator('[aria-expanded="true"]')).toHaveCount(0);
  await summary.scrollIntoViewIfNeeded();
  await parkMouse(page);
  await waitForStill(page);
  await shoot({ file: 'summary.png', clip: padded(await boxOf(summary), SHOT_PADDING) }, page);
  return weather;
};

const shootWeatherDetails = async (weather: Locator, page: Page) => {
  const header = weather.getByRole('button').first();

  await header.click();
  await weather.scrollIntoViewIfNeeded();
  await parkMouse(page);
  await waitForStill(page);
  const card = await boxOf(weather);
  const headerBox = await boxOf(header);
  const top = headerBox.y + headerBox.height;
  if (card.y + card.height > MOBILE_VIEWPORT.height) {
    throw new Error(`weather details ${JSON.stringify(card)} run past the bottom of the viewport`);
  }
  await shoot(
    {
      file: 'weather-details.png',
      clip: {
        x: card.x,
        y: top,
        width: card.width,
        height: card.y + card.height - top,
      },
    },
    page,
  );
};

test.describe.configure({ mode: 'serial' });

test.describe('flow 1', () => {
  test.use({ viewport: HERO_VIEWPORT });

  test('1 interactive heatmap', async ({ page }) => {
    await openHeatmapAtLocatedPosition(page);
    const dot = await zoomToPositionDot(page);
    const frames = heroFrames(dot);
    await shootLocate({ dot, clip: frames.locate }, page);
    const pick = await shootPick({ dot, clip: frames.pick }, page);
    await shootExport(pick, page);
  });
});

test.describe('flow 2', () => {
  test.use({ viewport: MOBILE_VIEWPORT, isMobile: true, hasTouch: true });

  test('laps in color', async ({ page }) => {
    await prepareContext(page);
    await loadDemoData(page);
    await openSession(LAPS_SESSION, page);

    await showDeviceLapsByHeartRate(page);
    await collapseSheet(page);
    await parkMouse(page);
    await shoot({ file: '2a-laps-hr.png' }, page);
    const repName = await shootTappedRep(page);
    await shootRepStats(repName, page);
  });
});

test.describe('desktop tiles', () => {
  test.use({ viewport: DESKTOP_VIEWPORT });

  test.beforeEach(async ({ page }) => {
    await prepareContext(page);
    await loadDemoData(page);
  });

  test('route studio', async ({ page }) => {
    await page.goto('/labs?tab=studio');
    await page.getByText(TEGERNSEE_LOOP).first().click();
    await page.waitForURL(/\/studio\/.+/);

    await addStudioMarkers(page);
    const studio = await pickStudioRoute(page);

    await waitForStill(page);
    await shoot({ file: 'studio.png', clip: padded(await boxOf(studio), SHOT_PADDING) }, page);
  });

  test('splits', async ({ page }) => {
    await openSession(STARNBERGER_LONG_RIDE, page);
    await page.getByTestId('laps-pill').click();
    const slider = page.getByRole('slider', { name: messageText('ui_laps_split_distance') });
    await slider.focus();
    for (let step = 0; step < SPLIT_SLIDER_STEPS; step++) {
      await page.keyboard.press('ArrowRight');
    }
    await expect(page.getByTestId('split-distance-value')).toHaveText(/^10\s*km$/);
    await parkMouse(page);
    await waitForStill(page);
    await shoot(
      { file: 'splits.png', clip: padded(await boxOf(popover(page)), SHOT_PADDING) },
      page,
    );
  });

  test('plain-text filters', async ({ page }) => {
    await page.goto('/');
    await hideOverlays(page);
    await page.getByRole('button', { name: messageText('ui_dock_filter') }).click();
    await page.getByRole('textbox').fill(BANNER_TEXT_BY_LOCALE[LOCALE].typedFilter);
    const tiles = page.getByTestId('filter-builder-tiles');
    await expect(tiles.getByRole('button')).toHaveCount(FILTER_READING_COUNT);
    await parkMouse(page);
    await waitForStill(page);
    const card = await boxOf(page.locator('[data-dock-card]'));
    const readings = await boxOf(tiles);
    await shoot(
      {
        file: 'filter.png',
        clip: {
          x: card.x,
          y: card.y,
          width: card.width,
          height: readings.y + readings.height + FILTER_READINGS_BOTTOM_PADDING - card.y,
        },
      },
      page,
    );
  });
});

test.describe('mobile tiles', () => {
  test.use({ viewport: MOBILE_VIEWPORT, isMobile: true, hasTouch: true });

  test('summary card and hourly weather', async ({ page }) => {
    await prepareContext(page);
    await loadDemoData(page);
    await openSession(WEATHER_SESSION, page);
    const weather = await shootSummary(page);
    await shootWeatherDetails(weather, page);
  });
});

test.describe('banner', () => {
  test.use({ viewport: BANNER_VIEWPORT });

  test('render banner', async ({ page }) => {
    await page.goto(`${BANNER_ORIGIN}/banner/page/index.html?locale=${LOCALE}`);
    const banner = page.locator('#banner');
    await expect(banner).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() =>
          [...document.images].every((image) => image.complete && image.naturalWidth > 0),
        ),
      )
      .toBe(true);
    await expect(page.locator('[data-overflow]')).toHaveCount(0);
    expect(await boxOf(banner)).toEqual({ x: 0, y: 0, ...BANNER_VIEWPORT });
    await waitForStill(page);
    await page.screenshot({ path: BANNER_PATH });
  });
});
