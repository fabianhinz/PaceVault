import { test, expect, type Page } from './helpers/test';
import { MAP_LAUNCH_OPTIONS, exposeMap, findPickableTrack, pointerState } from './helpers/map';
import { seedOnboardingComplete, CYCLING_FIT, RUNNING_FIT } from './helpers/seed';
import { uploadFitFiles } from './helpers/upload';

test.use({ launchOptions: MAP_LAUNCH_OPTIONS });

const MAP_EDGE = { x: 5, y: 5 };

const expectPointerOnlyOverTrack = async (page: Page) => {
  const hit = await findPickableTrack(page);
  await expect.poll(() => pointerState(page, hit)).toEqual({ pickCircle: true, cursor: 'pointer' });

  await page.mouse.move(MAP_EDGE.x, MAP_EDGE.y);
  await expect
    .poll(() => pointerState(page, MAP_EDGE))
    .toEqual({ pickCircle: false, cursor: 'grab' });
};

test.describe('map hover', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120_000);
    await seedOnboardingComplete(page);
    await uploadFitFiles(page, [CYCLING_FIT, RUNNING_FIT]);
  });

  test('map shows a pointer cursor over a pickable track', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    await expectPointerOnlyOverTrack(page);
  });

  test('session map shows a pointer cursor over the track while laps are on', async ({ page }) => {
    await page.goto('/sessions');
    await page.locator('[data-testid="session-item"]').first().click();
    await page.waitForURL(/\/sessions\/.+/);
    await expect(page.getByTestId('laps-pill')).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(3000);
    await expectPointerOnlyOverTrack(page);
  });

  test('track click opens the picker popover at the click point', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    const hit = await findPickableTrack(page);
    await page.mouse.click(hit.x, hit.y);

    const popover = page.locator('[data-radix-popper-content-wrapper]').getByRole('dialog');
    await expect(popover).toContainText('Sessions recorded near this location');
    await page.waitForTimeout(300);
    const box = await popover.boundingBox();
    if (!box) throw new Error('picker not rendered');
    const nearX = Math.min(Math.abs(box.x - hit.x), Math.abs(box.x + box.width - hit.x));
    const nearY = Math.min(Math.abs(box.y - hit.y), Math.abs(box.y + box.height - hit.y));
    expect(nearX).toBeLessThanOrEqual(8);
    expect(nearY).toBeLessThanOrEqual(8);

    await page.keyboard.press('Escape');
    await expect(popover).toBeHidden();
  });
});

const cameraOf = (page: Page) =>
  page.evaluate(() => {
    const map = Reflect.get(window, '__map');
    const center = map.getCenter();
    return {
      lng: Number(center.lng.toFixed(6)),
      lat: Number(center.lat.toFixed(6)),
      zoom: Number(map.getZoom().toFixed(4)),
      moving: map.isMoving(),
    };
  });

test.describe('map camera', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120_000);
    await seedOnboardingComplete(page);
    await uploadFitFiles(page, [CYCLING_FIT, RUNNING_FIT]);
  });

  test('back from a session keeps the overview camera', async ({ page }) => {
    await page.goto('/sessions');
    await page.waitForTimeout(3000);
    await exposeMap(page);
    await page.evaluate(() => {
      Reflect.get(window, '__map').jumpTo({ center: [8.4, 49.0], zoom: 6 });
    });

    await page.locator('[data-testid="session-item"]').first().click();
    await page.waitForURL(/\/sessions\/.+/);
    await expect(page.getByTestId('laps-pill')).toBeVisible({ timeout: 10_000 });
    await expect.poll(async () => (await cameraOf(page)).moving, { timeout: 5000 }).toBe(false);
    await page.waitForTimeout(500);

    await page.goBack();
    await page.waitForURL('/sessions');
    await expect(page.locator('[data-testid="session-item"]').first()).toBeVisible();
    const before = await cameraOf(page);
    await page.waitForTimeout(2000);
    expect(await cameraOf(page)).toEqual({ ...before, moving: false });
  });
});

test.describe('overview map controls', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120_000);
    await seedOnboardingComplete(page);
    await uploadFitFiles(page, [CYCLING_FIT, RUNNING_FIT]);
  });

  test('track intensity pill switches presets, survives a reload and hides on a session page', async ({
    page,
  }) => {
    await page.goto('/sessions');
    const pill = page.getByTestId('track-intensity-pill');
    await expect(pill).toHaveAccessibleName('Warm', { timeout: 10_000 });

    await pill.click();
    await page.getByRole('radio', { name: /^Hot/ }).click();
    await expect(pill).toHaveAccessibleName('Hot');

    await page.reload();
    await expect(pill).toHaveAccessibleName('Hot', { timeout: 10_000 });

    await page.locator('[data-testid="session-item"]').first().click();
    await page.waitForURL(/\/sessions\/.+/);
    await expect(page.getByTestId('laps-pill')).toBeVisible({ timeout: 10_000 });
    await expect(pill).toBeHidden();
  });
});

const viewOf = (page: Page) =>
  page.evaluate(() => {
    const map = Reflect.get(window, '__map');
    const center = map.getCenter();
    return {
      lng: Number(center.lng.toFixed(6)),
      lat: Number(center.lat.toFixed(6)),
      zoom: Number(map.getZoom().toFixed(4)),
      pitch: Number(map.getPitch().toFixed(1)) + 0,
      bearing: Number(map.getBearing().toFixed(1)) + 0,
      terrain: map.getTerrain() !== null,
      minZoom: Number(map.getMinZoom().toFixed(4)),
      moving: map.isMoving(),
      boxZoom: map.boxZoom.isEnabled(),
    };
  });

const deckLayerShown = (page: Page, id: string) =>
  page.evaluate((id) => {
    const map = Reflect.get(window, '__map');
    const overlay = map._controls.find((control: object) => '_deck' in control);
    const layer = overlay?._deck?.layerManager
      ?.getLayers()
      .find((candidate: { id: string }) => candidate.id === id);
    return layer?.props.visible === true && layer.isLoaded === true;
  }, id);

const pickMapView = async (page: Page, view: '2D' | '3D') => {
  await page.getByTestId('map-view-pill').click();
  await page.getByRole('radio', { name: new RegExp(`^${view}`) }).click();
  await expect(page.getByTestId('map-view-pill')).toHaveAccessibleName(`Map view: ${view}`);
};

test.describe('session map view', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120_000);
    await page.route('https://tiles.mapterhorn.com/**', (route) => route.abort());
    await seedOnboardingComplete(page);
    await uploadFitFiles(page, [CYCLING_FIT, RUNNING_FIT]);
  });

  test('switching 2D and 3D only tilts, keeps the zoom-out limit and leaves none behind', async ({
    page,
  }) => {
    await page.goto('/sessions');
    await page.waitForTimeout(3000);
    await exposeMap(page);
    const overviewMinZoom = (await viewOf(page)).minZoom;

    await page.locator('[data-testid="session-item"]').first().click();
    await page.waitForURL(/\/sessions\/.+/);
    const pill = page.getByTestId('map-view-pill');
    await expect(pill).toHaveAccessibleName('Map view: 2D', { timeout: 10_000 });
    await expect
      .poll(async () => (await viewOf(page)).minZoom, { timeout: 5000 })
      .not.toBe(overviewMinZoom);
    const flat = await viewOf(page);
    expect(flat.moving).toBe(false);
    expect(flat.boxZoom).toBe(false);
    expect(flat.minZoom).toBeLessThanOrEqual(flat.zoom);

    const deckErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error' && message.text().startsWith('deck:')) {
        deckErrors.push(message.text());
      }
    });
    await pickMapView(page, '3D');
    await expect.poll(async () => (await viewOf(page)).pitch, { timeout: 5000 }).toBe(30);
    const tilted = await viewOf(page);
    expect(tilted).toMatchObject({
      lng: flat.lng,
      lat: flat.lat,
      zoom: flat.zoom,
      terrain: true,
      minZoom: flat.minZoom,
    });

    await page.evaluate(() => Reflect.get(window, '__map').setBearing(40));
    await pickMapView(page, '2D');
    await expect
      .poll(async () => {
        const view = await viewOf(page);
        return { pitch: view.pitch, bearing: view.bearing, moving: view.moving };
      })
      .toEqual({ pitch: 0, bearing: 0, moving: false });
    expect(await viewOf(page)).toMatchObject({
      zoom: flat.zoom,
      terrain: false,
      minZoom: flat.minZoom,
      boxZoom: false,
    });
    await expect.poll(() => deckLayerShown(page, 'session-detail'), { timeout: 10_000 }).toBe(true);
    expect(deckErrors).toEqual([]);

    await page.goBack();
    await page.waitForURL('/sessions');
    await expect.poll(async () => (await viewOf(page)).minZoom).toBe(overviewMinZoom);
  });
});
