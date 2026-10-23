import { dirname, resolve } from 'node:path';
import { expect, loadDemoData, prepare, shootAll, test, type Page } from '../../../shared/capture';

const SESSION_NAME = 'Passo San Giovanni loop';
const SESSIONS_STORE_URL = '/src/store/sessions.ts';
const MAP_CONTROLS_STORE_URL = '/src/store/mapControls.ts';
const MAP_SETTLE_MS = 2_500;
const MAPTERHORN_TILES = 'https://tiles.mapterhorn.com/**';
const TERRAIN_IDLE_TIMEOUT_MS = 45_000;

const demoSessionId = async (page: Page) => {
  const id: unknown = await page.evaluate(
    async (args) => {
      const store = await import(args.url);
      const sessions: Array<{ id: string; name?: string }> =
        store.useSessionsStore.getState().sessions;
      return sessions.find((session) => session.name === args.name)?.id;
    },
    { url: SESSIONS_STORE_URL, name: SESSION_NAME },
  );
  if (typeof id !== 'string') throw new Error(`demo session "${SESSION_NAME}" not found`);
  return id;
};

const switchToDeviceLaps = async (page: Page, sessionId: string) => {
  await page.goto(`/sessions/${sessionId}`);
  const lapsPill = page.getByTestId('laps-pill');
  await expect(lapsPill).toBeVisible({ timeout: 30_000 });
  await lapsPill.click();
  await page.getByRole('radio', { name: /device laps/i }).click();
  await expect(lapsPill).toHaveText(/^\d+ device laps$/, { timeout: 10_000 });
};

const openSession = async (page: Page, sessionId: string) => {
  await page.goto(`/sessions/${sessionId}`);
  await expect(page.getByTestId('laps-pill')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('color-by-pill')).toBeVisible();
  await expect(page.locator('.maplibregl-map')).toBeVisible();
};

const SELECT_LAP_ATTEMPTS = 3;

const selectFirstLap = (page: Page) =>
  page.evaluate(async (url) => {
    const store = await import(url);
    store.useMapControlsStore.getState().selectLap(0);
  }, MAP_CONTROLS_STORE_URL);

const selectSecondLap = async (page: Page) => {
  for (let attempt = 1; ; attempt++) {
    try {
      await selectFirstLap(page);
      break;
    } catch (error) {
      if (attempt === SELECT_LAP_ATTEMPTS || !String(error).includes('Execution context was destroyed'))
        throw error;
      await settleMap(page);
    }
  }
  const stepper = page.getByTestId('lap-stepper');
  await expect(stepper).toBeVisible({ timeout: 10_000 });
  await stepper.getByTestId('lap-stepper-next').click();
  await expect(stepper.getByTestId('lap-stepper-name')).toHaveText(/2/);
};

const setUp = async (page: Page) => {
  test.setTimeout(300_000);
  await prepare(page, 'en');
  await loadDemoData(page);
  const sessionId = await demoSessionId(page);
  await switchToDeviceLaps(page, sessionId);
  return sessionId;
};

test('session map in 2D with device laps', async ({ page }) => {
  const sessionId = await setUp(page);
  await shootAll(page, 'session-map-2d', async (p) => {
    await openSession(p, sessionId);
    await p.waitForTimeout(MAP_SETTLE_MS);
  });
});

test('session map in 2D with a lap selected', async ({ page }) => {
  const sessionId = await setUp(page);
  await shootAll(page, 'session-map-2d-lap', async (p) => {
    await openSession(p, sessionId);
    await selectSecondLap(p);
    await p.waitForTimeout(MAP_SETTLE_MS);
  });
});

const pickMapView = async (page: Page, view: '2D' | '3D') => {
  const pill = page.getByTestId('map-view-pill');
  await expect(pill).toBeVisible({ timeout: 10_000 });
  await pill.click();
  await page.getByRole('radio', { name: new RegExp(`^${view}`) }).click();
  await expect(pill).toContainText(view);
};

const waitForMapIdle = async (page: Page) => {
  await page.evaluate(async (timeout) => {
    const element = document.querySelector('.maplibregl-map');
    if (!element) throw new Error('no map');
    const fiberKey = Object.keys(element).find((key) => key.startsWith('__reactFiber'));
    let fiber = fiberKey ? Reflect.get(element, fiberKey) : null;
    let map = null;
    while (fiber && !map) {
      const ref = fiber.memoizedProps?.ref ?? fiber.ref;
      if (ref?.current?.getMap) map = ref.current.getMap();
      fiber = fiber.return;
    }
    if (!map) throw new Error('no map ref');
    const settled = () => map.loaded() && !map.isMoving() && map.areTilesLoaded();
    const started = Date.now();
    while (!settled() && Date.now() - started < timeout) {
      await new Promise((done) => setTimeout(done, 250));
    }
  }, TERRAIN_IDLE_TIMEOUT_MS);
};

const expandAttribution = async (page: Page) => {
  const attribution = page.locator('.maplibregl-ctrl-attrib');
  if (await attribution.evaluate((node) => node.classList.contains('maplibregl-compact-show')))
    return;
  await page.locator('.maplibregl-ctrl-attrib-button').click();
};

const settleMap = (page: Page) => page.waitForTimeout(MAP_SETTLE_MS);

const openIn3d = async (page: Page, sessionId: string) => {
  await openSession(page, sessionId);
  await settleMap(page);
  await pickMapView(page, '3D');
  await waitForMapIdle(page);
};

test('session map view popover open', async ({ page }) => {
  const sessionId = await setUp(page);
  await shootAll(page, 'session-map-view-popover', async (p) => {
    await openSession(p, sessionId);
    await settleMap(p);
    await p.getByTestId('map-view-pill').click();
    await expect(p.getByRole('radio', { name: /^3D/ })).toBeVisible();
  });
});

test('session map in 3D', async ({ page }) => {
  const sessionId = await setUp(page);
  await shootAll(page, 'session-map-3d', async (p) => {
    await openIn3d(p, sessionId);
    await expandAttribution(p);
    await expect(p.locator('.maplibregl-ctrl-attrib')).toContainText('Mapterhorn');
    await settleMap(p);
  });
});

test('session map in 3D with a lap selected', async ({ page }) => {
  const sessionId = await setUp(page);
  await shootAll(page, 'session-map-3d-lap', async (p) => {
    await openIn3d(p, sessionId);
    await selectSecondLap(p);
    await settleMap(p);
    await waitForMapIdle(p);
  });
});

test('session map in 3D without terrain tiles', async ({ page }) => {
  await page.route(MAPTERHORN_TILES, (route) => route.abort());
  const sessionId = await setUp(page);
  await shootAll(page, 'session-map-3d-offline', async (p) => {
    await openIn3d(p, sessionId);
    await settleMap(p);
  });
});

const shootAttribution = async (page: Page, name: string) => {
  await expandAttribution(page);
  const attribution = page.locator('.maplibregl-ctrl-attrib');
  await expect(attribution).toContainText('Mapterhorn');
  await page.addStyleTag({
    content:
      '.maplibregl-ctrl-bottom-right { top: 16px !important; bottom: auto !important; right: auto !important; left: 96px !important; }',
  });
  await settleMap(page);
  await attribution.screenshot({
    path: resolve(dirname(test.info().file), 'after', `d-en-${name}.png`),
  });
};

test('session map in 3D, attribution with the Mapterhorn credit', async ({ page }) => {
  const sessionId = await setUp(page);
  await page.setViewportSize({ width: 1280, height: 800 });
  await openIn3d(page, sessionId);
  await shootAttribution(page, 'session-map-3d-attribution');
});

test('session map in 2D, attribution with the Mapterhorn credit', async ({ page }) => {
  const sessionId = await setUp(page);
  await page.setViewportSize({ width: 1280, height: 800 });
  await openSession(page, sessionId);
  await settleMap(page);
  await shootAttribution(page, 'session-map-2d-attribution');
});

test('session map in 3D after closing a lap', async ({ page }) => {
  const sessionId = await setUp(page);
  await shootAll(page, 'session-map-3d-lap-closed', async (p) => {
    await openIn3d(p, sessionId);
    await selectSecondLap(p);
    await settleMap(p);
    await p.getByTestId('lap-stepper-clear').click();
    await expect(p.getByTestId('lap-stepper')).toBeHidden({ timeout: 10_000 });
    await settleMap(p);
    await waitForMapIdle(p);
  });
});
