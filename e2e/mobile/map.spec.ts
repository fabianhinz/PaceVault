import { test, expect, type Locator, type Page } from '../helpers/test';
import { DB_NAME } from '../../src/lib/db.ts';
import {
  seedOnboardingComplete,
  seedWithSessions,
  CYCLING_FIT,
  RUNNING_FIT,
} from '../helpers/seed';
import { uploadFitFiles } from '../helpers/upload';
import { expectFilterInputStaysPut } from '../helpers/filters';
import { exposeMap } from '../helpers/map';

test.use({
  launchOptions: {
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  },
});

const SCAN_STEP = 20;
const SCAN_BOTTOM = 400;

const findTrackPoint = async (page: Page) => {
  const viewport = page.viewportSize();
  if (!viewport) throw new Error('no viewport');
  await exposeMap(page);
  for (let y = SCAN_STEP; y < SCAN_BOTTOM; y += SCAN_STEP) {
    for (let x = SCAN_STEP; x < viewport.width; x += SCAN_STEP) {
      const picked = await page.evaluate(
        (p) => {
          const map = Reflect.get(window, '__map');
          const canvas = map.getCanvas().getBoundingClientRect();
          const hit = map.__deck.pickObject({
            x: p.x - canvas.left,
            y: p.y - canvas.top,
            radius: 4,
          });
          const onMap = !!document
            .elementFromPoint(p.x, p.y)
            ?.closest('.maplibregl-canvas-container');
          return !!hit?.object && onMap;
        },
        { x, y },
      );
      if (picked) return { x, y };
    }
  }
  throw new Error('no pickable track under any scanned point');
};

const sheet = (page: Page) => page.locator('[data-sheet-position]');

const handle = (page: Page) => sheet(page).locator('[data-sheet-handle]');

const sheetScroller = (page: Page) => page.locator('[data-layout="main"]').locator('..');

const dragHandle = async (page: Page, grip: Locator, target: { by?: number; toY?: number }) => {
  const box = await grip.boundingBox();
  if (!box) throw new Error('handle not rendered');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, target.toY ?? y + (target.by ?? 0), { steps: 20 });
  await page.waitForTimeout(200);
  await page.mouse.up();
};

const persistedPosition = (page: Page) =>
  page.evaluate(
    (dbName) =>
      new Promise<number | undefined>((resolve) => {
        const openReq = indexedDB.open(dbName);
        openReq.onsuccess = () => {
          const getReq = openReq.result.transaction('kv').objectStore('kv').get('store-layout');
          getReq.onsuccess = () => {
            openReq.result.close();
            resolve(JSON.parse(getReq.result ?? '{}').state?.mobileSheetPosition);
          };
        };
      }),
    DB_NAME,
  );

test.describe('mobile bottom sheet', () => {
  test.describe('positioning', () => {
    test.beforeEach(async ({ page }) => {
      await seedOnboardingComplete(page);
    });

    test('opens in the middle by default', async ({ page }) => {
      await expect(sheet(page)).toHaveAttribute('data-sheet-position', '0.50');
    });

    test('tapping the handle flips to the farther end', async ({ page }) => {
      await handle(page).click();
      await expect(sheet(page)).toHaveAttribute('data-sheet-position', '1.00');
      await expect(handle(page)).toHaveAttribute('aria-label', 'Collapse panel');

      await handle(page).click();
      await expect(sheet(page)).toHaveAttribute('data-sheet-position', '0.00');
      await expect(handle(page)).toHaveAttribute('aria-label', 'Expand panel');
    });

    test('dragging leaves the sheet where it is released and survives a reload', async ({
      page,
    }) => {
      await dragHandle(page, handle(page), { by: 120 });

      await expect
        .poll(async () => {
          const position = await persistedPosition(page);
          return position !== undefined && position > 0.05 && position < 0.45;
        })
        .toBe(true);
      const dragged = await sheet(page).getAttribute('data-sheet-position');

      await page.reload();
      await expect(sheet(page)).toHaveAttribute('data-sheet-position', dragged ?? '');
    });

    test('dragging past either end stops at full or peek', async ({ page }) => {
      await dragHandle(page, handle(page), { toY: 0 });
      await expect(sheet(page)).toHaveAttribute('data-sheet-position', '1.00');

      await dragHandle(page, handle(page), { toY: 840 });
      await expect(sheet(page)).toHaveAttribute('data-sheet-position', '0.00');
    });

    test('a release inside the fade zone settles on the more visible layer', async ({ page }) => {
      await dragHandle(page, handle(page), { toY: 840 });
      await expect(sheet(page)).toHaveAttribute('data-sheet-position', '0.00');

      await dragHandle(page, handle(page), { by: -20 });
      await expect(sheet(page)).toHaveAttribute('data-sheet-position', '0.00');

      await dragHandle(page, handle(page), { by: -70 });
      await expect(sheet(page)).toHaveAttribute('data-sheet-position', '0.15');
    });
  });

  test.describe('content', () => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const sessions = Array.from({ length: 40 }, (_, i) => ({
      sport: 'running' as const,
      date: now - (i + 1) * day,
      name: `Seed run ${i + 1}`,
    }));

    test.beforeEach(async ({ page }) => {
      await seedWithSessions(page, sessions);
    });

    test('swaps the content for a summary at peek and back when dragged up', async ({ page }) => {
      const peek = page.locator('[data-sheet-peek]');
      await dragHandle(page, handle(page), { toY: 840 });
      await expect(sheet(page)).toHaveAttribute('data-sheet-position', '0.00');

      await expect(peek).toContainText('Dashboard');
      await expect(peek).toContainText('Current Form');
      await expect(peek).toHaveCSS('opacity', '1');
      await expect(sheetScroller(page)).toHaveCSS('opacity', '0');

      await dragHandle(page, handle(page), { toY: 0 });
      await expect(sheet(page)).toHaveAttribute('data-sheet-position', '1.00');
      await expect(peek).toHaveCSS('opacity', '0');
      await expect(sheetScroller(page)).toHaveCSS('opacity', '1');
    });

    test('shows a divider under the grabber only once the content is scrolled past a nudge', async ({
      page,
    }) => {
      const divider = page.locator('[data-sheet-divider]');
      await expect(page.getByRole('region', { name: 'Performance Metrics' })).toBeVisible();
      await expect(divider).toHaveCSS('opacity', '0');

      await sheetScroller(page).evaluate((el) => el.scrollTo({ top: 6 }));
      await page.waitForTimeout(300);
      await expect(divider).toHaveCSS('opacity', '0');

      await sheetScroller(page).evaluate((el) => el.scrollTo({ top: 200 }));
      await expect(divider).toHaveCSS('opacity', '1');

      await sheetScroller(page).evaluate((el) => el.scrollTo({ top: 0 }));
      await expect(divider).toHaveCSS('opacity', '0');
    });

    test('renders session rows past the first screen inside the sheet', async ({ page }) => {
      await page.getByRole('link', { name: /sessions/i }).click();
      await expect(page.locator('[data-testid="session-item"]').first()).toBeVisible();

      await sheetScroller(page).evaluate((el) => el.scrollTo({ top: el.scrollHeight }));

      await expect(page.locator('[data-index="39"]')).toBeVisible();
    });
  });
});

test.describe('mobile dock', () => {
  test.beforeEach(async ({ page }) => {
    const now = Date.now();
    await seedWithSessions(page, [
      { sport: 'running', date: now - 2 * 24 * 60 * 60 * 1000, name: 'Recent Run' },
      { sport: 'cycling', date: now - 20 * 24 * 60 * 60 * 1000, name: 'Older Ride' },
    ]);
  });

  test('switches tabs and opens the filter sheet without moving the row', async ({ page }) => {
    const dock = page.locator('[data-layout="dock"]');
    const sessionsTab = dock.getByRole('link', { name: /sessions/i });
    const filterButton = dock.getByRole('button', {
      name: 'Filter',
      exact: true,
      includeHidden: true,
    });
    const sheet = page.getByRole('dialog', { name: 'Filter' });
    const field = sheet.getByLabel(/describe a filter/i);
    const list = sheet.getByRole('group', { name: /choose filter/i });

    await sessionsTab.click();
    await page.waitForURL('/sessions');
    await expect(page.locator('[data-testid="session-item"]')).toHaveCount(2);
    const rowBefore = await dock.boundingBox();

    await filterButton.click();
    await expect(field).toBeVisible();
    await expect(list).toBeVisible();
    await expect(filterButton).toHaveAttribute('aria-expanded', 'true');
    expect(await dock.boundingBox()).toEqual(rowBefore);

    await list.getByRole('button', { name: 'last 7 days', exact: true }).click();
    await expect(page.locator('[data-testid="session-item"]')).toHaveCount(1);

    await field.fill('ride');
    await expect(page.getByTestId('filter-builder-tiles')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
    await expect(filterButton).toHaveAttribute('aria-expanded', 'false');
    await expect(filterButton.getByTestId('icon-badge')).toBeVisible();

    await filterButton.click();
    await expect(field).toHaveValue('');
    await field.fill('run');
    await page.mouse.click(195, 20);
    await expect(sheet).toBeHidden();
    await expect(filterButton).toHaveAttribute('aria-expanded', 'false');

    await filterButton.click();
    await expect(field).toHaveValue('');
  });

  test('filter input stays in place while typing', async ({ page }) => {
    await page
      .locator('[data-layout="dock"]')
      .getByRole('button', { name: 'Filter', exact: true })
      .click();
    await expectFilterInputStaysPut(page, 'older');
  });

  test('toast does not cover the dock', async ({ page }) => {
    const dock = page.locator('[data-layout="dock"]');
    await expect(dock).toBeVisible();
    await page.evaluate(async () => {
      const store = await import('/src/components/ui/toastStore.ts');
      store.useToastStore
        .getState()
        .addToast({ id: 'dock-overlap', title: 'Saved', persistent: true });
    });
    const toast = page.getByTestId('dock-overlap');
    await expect(toast).toBeVisible();
    await page.waitForTimeout(500);

    const toastBox = await toast.boundingBox();
    const dockBox = await dock.boundingBox();
    if (!toastBox || !dockBox) throw new Error('toast or dock not rendered');
    expect(toastBox.y + toastBox.height).toBeLessThanOrEqual(dockBox.y);
  });
});

test.describe('mobile map', () => {
  test('tapping a track on a touch device opens the session picker', async ({ page }) => {
    test.setTimeout(120_000);
    await seedOnboardingComplete(page);
    await uploadFitFiles(page, [CYCLING_FIT, RUNNING_FIT]);
    await page.goto('/');
    await page.waitForTimeout(3000);
    const track = await findTrackPoint(page);
    await page.mouse.move(2, 2);

    const picker = page.getByRole('dialog');
    await page.touchscreen.tap(track.x, track.y);
    await expect(picker).toContainText('Sessions recorded near this location');
    await page.waitForTimeout(500);
    await expect(picker).toBeVisible();
    const pickCircle = await page.evaluate(async () => {
      const mapFocus = await import('/src/store/mapFocus.ts');
      return mapFocus.useMapFocusStore.getState().pickCircle;
    });
    expect(pickCircle).toBeNull();

    await page.touchscreen.tap(track.x, 40);
    await expect(picker).toBeHidden();

    await page.touchscreen.tap(track.x, track.y);
    await expect(picker).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(picker).toBeHidden();

    await page.touchscreen.tap(track.x, track.y);
    await expect(picker).toBeVisible();
    await page.waitForTimeout(500);
    const card = await picker.boundingBox();
    if (!card) throw new Error('picker not rendered');
    expect(card.x).toBeCloseTo(8, 0);
    expect(card.x + card.width).toBeCloseTo(382, 0);
    expect(card.y + card.height).toBeLessThanOrEqual(844 - 12);

    await expect(picker.getByRole('button', { name: 'Close', exact: true })).toHaveCount(0);
    const grabber = picker.getByRole('button', { name: 'Drag to close' });
    await grabber.tap();
    await expect(picker).toBeHidden();

    await page.touchscreen.tap(track.x, track.y);
    await expect(picker).toBeVisible();
    await page.waitForTimeout(500);
    await dragHandle(page, grabber, { by: 40 });
    await page.waitForTimeout(500);
    await expect(picker).toBeVisible();
    const settled = await picker.boundingBox();
    if (!settled) throw new Error('picker not rendered');
    expect(settled.y).toBeCloseTo(card.y, 0);

    await dragHandle(page, grabber, { by: card.height * 0.6 });
    await expect(picker).toBeHidden();

    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(1500);
    const landscapeTrack = await findTrackPoint(page);
    await page.mouse.move(2, 2);
    await page.touchscreen.tap(landscapeTrack.x, landscapeTrack.y);
    await expect(picker).toBeVisible();
    await page.waitForTimeout(500);
    const landscape = await picker.boundingBox();
    if (!landscape) throw new Error('picker not rendered');
    expect(landscape.width).toBeLessThanOrEqual(512);
    expect(landscape.x).toBeCloseTo((844 - landscape.width) / 2, 0);
    expect(landscape.y).toBeGreaterThanOrEqual(390 * 0.08);
  });

  test('chart scrub on touch moves the map circle', async ({ page }) => {
    test.setTimeout(120_000);
    await seedOnboardingComplete(page);
    const finePointer = await page.evaluate(async () => {
      const device = await import('/src/lib/hooks/useDevice.ts');
      return window.matchMedia(device.FINE_POINTER_QUERY).matches;
    });
    expect(finePointer).toBe(false);

    await uploadFitFiles(page, [RUNNING_FIT]);
    await page.goto('/sessions');
    await page.locator('[data-testid="session-item"]').first().click();
    await page.waitForURL(/\/sessions\/.+/);
    const chart = page.locator('.recharts-wrapper').first();
    await expect(chart.locator('.recharts-surface')).toBeVisible({ timeout: 20_000 });
    await chart.evaluate((element) => element.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(500);
    const box = await chart.boundingBox();
    if (!box) throw new Error('no chart');

    const client = await page.context().newCDPSession(page);
    const y = box.y + box.height / 2;
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: box.x + box.width * 0.3, y }],
    });
    for (let step = 1; step <= 10; step++) {
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: box.x + box.width * (0.3 + step * 0.03), y }],
      });
    }

    const hover = () =>
      page.evaluate(async () => {
        const chartHover = await import('/src/store/chartHover.ts');
        const mapFocus = await import('/src/store/mapFocus.ts');
        return {
          crosshair:
            (chartHover.useChartHoverStore.getState().hoveredX['session-detail'] ?? null) !== null,
          mapPoint: mapFocus.useMapFocusStore.getState().hoveredPoint,
        };
      });
    await expect
      .poll(hover)
      .toEqual({ crosshair: true, mapPoint: [expect.any(Number), expect.any(Number)] });

    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  });
});

test.describe('mobile lap zoom', () => {
  test.use({ viewport: { width: 390, height: 664 } });

  test('tapping a lap zooms it into the visible box with 44 px controls that stay put', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await seedOnboardingComplete(page);
    await uploadFitFiles(page, [RUNNING_FIT]);
    await page.goto('/sessions');
    await page.locator('[data-testid="session-item"]').first().click();
    await page.waitForURL(/\/sessions\/.+/);
    const chart = page.locator('.recharts-wrapper').first();
    await expect(chart.getByTestId('lap-band').first()).toBeAttached({ timeout: 20_000 });
    await page.waitForTimeout(2000);

    await exposeMap(page);
    await page.evaluate(() => {
      const target = Reflect.get(window, '__mapRef');
      const original = target.fitBounds;
      Reflect.set(window, '__lapFits', []);
      target.fitBounds = (bounds: unknown, options: { maxZoom?: number }, data: unknown) => {
        if (options?.maxZoom === 16) Reflect.get(window, '__lapFits').push(bounds);
        return original(bounds, options, data);
      };
    });

    const scroller = page.getByTestId('map-pills').locator('..');
    const scrollBefore = await scroller.evaluate((element) => element.scrollLeft);

    await chart.evaluate((element) => element.scrollIntoView({ block: 'start' }));
    await page.waitForTimeout(300);
    const chartBox = await chart.boundingBox();
    const bandBox = await chart.getByTestId('lap-band').nth(3).locator('rect').last().boundingBox();
    if (!chartBox || !bandBox) throw new Error('no lap band');
    await page.touchscreen.tap(bandBox.x + bandBox.width / 2, chartBox.y + chartBox.height / 2);

    await expect(page.getByTestId('lap-stepper')).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() => {
          const fits = Reflect.get(window, '__lapFits');
          const map = Reflect.get(window, '__map');
          return fits.length > 0 && !map.isMoving();
        }),
      )
      .toBe(true);
    await page.waitForTimeout(200);

    const pillsBox = await page.getByTestId('map-pills').boundingBox();
    if (!pillsBox) throw new Error('no controls row');
    const lapBox = await page.evaluate(() => {
      const fits = Reflect.get(window, '__lapFits');
      const map = Reflect.get(window, '__map');
      const bounds = fits[fits.length - 1];
      const a = map.project(bounds[0]);
      const b = map.project(bounds[1]);
      return {
        top: Math.min(a.y, b.y),
        bottom: Math.max(a.y, b.y),
        left: Math.min(a.x, b.x),
        right: Math.max(a.x, b.x),
      };
    });
    expect(lapBox.top).toBeGreaterThanOrEqual(0);
    expect(lapBox.bottom).toBeLessThanOrEqual(pillsBox.y);
    expect(lapBox.left).toBeGreaterThanOrEqual(0);
    expect(lapBox.right).toBeLessThanOrEqual(390);

    for (const testId of ['lap-stepper-prev', 'lap-stepper-next', 'lap-stepper-clear']) {
      const box = await page.getByTestId(testId).boundingBox();
      if (!box) throw new Error(`${testId} not rendered`);
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }

    expect(await scroller.evaluate((element) => element.scrollLeft)).toBe(scrollBefore);
  });

  test('tapping a lap on the map track zooms to it instead of the emulated mouse aborting the fit', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await seedOnboardingComplete(page);
    await uploadFitFiles(page, [CYCLING_FIT]);
    await page.goto('/sessions');
    await page.locator('[data-testid="session-item"]').first().click();
    await page.waitForURL(/\/sessions\/.+/);
    await expect(page.getByTestId('laps-pill')).toBeVisible({ timeout: 20_000 });
    await page.waitForTimeout(2500);
    await exposeMap(page);

    const lapPoints = await page.evaluate(async () => {
      const mapControls = await import('/src/store/mapControls.ts');
      const map = Reflect.get(window, '__map');
      const layer = map.__deck.layerManager
        .getLayers()
        .find((candidate: { id: string }) => candidate.id === 'session-detail');
      const detail = layer.props.data[0];
      const spans = mapControls.useMapControlsStore.getState().sessionLaps?.spans ?? [];
      const canvas = map.getCanvas().getBoundingClientRect();
      return spans.map((span: { lapIndex: number; startRecord: number; endRecord: number }) => {
        const vertices = detail.recordIndices.flatMap((record: number, vertex: number) => {
          if (record >= span.startRecord && record <= span.endRecord) return [vertex];
          return [];
        });
        const point = map.project(detail.path[vertices[Math.floor(vertices.length / 2)]]);
        const x = Math.round(point.x + canvas.left);
        const y = Math.round(point.y + canvas.top);
        const onMap = !!document.elementFromPoint(x, y)?.closest('.maplibregl-canvas-container');
        return { lapIndex: span.lapIndex, x, y, onMap };
      });
    });
    const target = lapPoints.find((point: { onMap: boolean }) => point.onMap);
    if (!target) throw new Error('no lap on the visible map');

    const mapState = () =>
      page.evaluate(async () => {
        const mapControls = await import('/src/store/mapControls.ts');
        const mapFocus = await import('/src/store/mapFocus.ts');
        const map = Reflect.get(window, '__map');
        return {
          selectedLapIndex: mapControls.useMapControlsStore.getState().selectedLapIndex,
          pickCircle: mapFocus.useMapFocusStore.getState().pickCircle,
          zoom: map.getZoom(),
          moving: map.isMoving(),
        };
      });
    const sessionZoom = (await mapState()).zoom;

    await page.touchscreen.tap(target.x, target.y);

    await expect.poll(async () => (await mapState()).selectedLapIndex).toBe(target.lapIndex);
    await expect.poll(async () => (await mapState()).moving).toBe(false);
    await page.waitForTimeout(300);
    const settled = await mapState();
    expect(settled.zoom).toBeGreaterThan(sessionZoom + 1);
    expect(settled.pickCircle).toBeNull();
  });
});
