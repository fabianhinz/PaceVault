import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  expect,
  loadDemoData,
  prepare,
  shootAll,
  test,
  type Locator,
  type Page,
  type Shot,
} from '../../../shared/capture';
import { FLAUCHER_EASY } from '../../../../../apps/web/src/lib/demo/demoSchedule.ts';
import { DB_NAME } from '../../../../../apps/web/src/lib/storage/db.ts';
import { exposeMap } from '../../../../../apps/web/e2e/helpers/map.ts';

const DETECTION_TIMEOUT_MS = 120_000;
const SCENE_TIMEOUT_MS = 600_000;
const CAMERA_SETTLE_MS = 2_500;

type Picked = { sessionId: string; segmentId: string };

const readKv = async (page: Page, args: { dbName: string; store: string; key?: string }) =>
  page.evaluate(
    async (input) =>
      new Promise<unknown>((resolveRead, reject) => {
        const openRequest = indexedDB.open(input.dbName);
        openRequest.onerror = () => reject(openRequest.error);
        openRequest.onsuccess = () => {
          const database = openRequest.result;
          const store = database.transaction(input.store).objectStore(input.store);
          const request = input.key === undefined ? store.getAll() : store.get(input.key);
          request.onerror = () => reject(request.error);
          request.onsuccess = () => {
            database.close();
            resolveRead(request.result);
          };
        };
      }),
    args,
  );

const latestSessionIdByName = async (page: Page, name: string) => {
  const raw = await readKv(page, { dbName: DB_NAME, store: 'kv', key: 'store-sessions' });
  if (typeof raw !== 'string') throw new Error('store-sessions missing');
  const persisted: { state: { sessions: { id: string; name?: string; date: number }[] } } =
    JSON.parse(raw);
  const latest = persisted.state.sessions
    .filter((session) => session.name === name)
    .sort((first, second) => second.date - first.date)[0];
  if (latest === undefined) throw new Error(`no session named ${name}`);
  return latest.id;
};

type StoredEntry = {
  segments: {
    id: string;
    type: string;
    geometry: [number, number][];
    passes: { sessionId: string; date: number }[];
  }[];
};

const storedSegments = async (page: Page) =>
  ((await readKv(page, { dbName: DB_NAME, store: 'segments' })) as StoredEntry[]).flatMap(
    (entry) => entry.segments,
  );

const busiestSessionId = async (page: Page) => {
  const countBySession = new Map<string, { count: number; date: number }>();
  for (const segment of await storedSegments(page)) {
    for (const pass of segment.passes) {
      const current = countBySession.get(pass.sessionId) ?? { count: 0, date: pass.date };
      countBySession.set(pass.sessionId, { count: current.count + 1, date: pass.date });
    }
  }
  const busiest = [...countBySession.entries()].sort(
    (first, second) => second[1].count - first[1].count || second[1].date - first[1].date,
  )[0];
  if (busiest === undefined) throw new Error('no passes stored');
  return busiest[0];
};

const MAP_AREA = {
  d: { left: 90, right: 740, top: 60, bottom: 690 },
  p: { left: 20, right: 370, top: 60, bottom: 290 },
};

const bandPointOnScreen = async (page: Page, args: { segmentId: string; device: Shot['device'] }) => {
  await exposeMap(page);
  const segment = (await storedSegments(page)).find((candidate) => candidate.id === args.segmentId);
  if (segment === undefined) throw new Error(`segment ${args.segmentId} missing`);
  const area = MAP_AREA[args.device];
  const projected = await page.evaluate(
    (geometry) => {
      const map = Reflect.get(window, '__map') as {
        project: (lngLat: [number, number]) => { x: number; y: number };
      };
      return geometry.map((point) => map.project([point[1], point[0]]));
    },
    segment.geometry,
  );
  const inside = projected.filter(
    (point) =>
      point.x > area.left && point.x < area.right && point.y > area.top && point.y < area.bottom,
  );
  const middle = inside[Math.floor(inside.length / 2)];
  if (middle === undefined) throw new Error('segment band not on screen');
  return middle;
};

const switchMapTo3d = async (page: Page) => {
  const pill = page.getByTestId('map-view-pill');
  await expect(pill).toBeVisible({ timeout: 30_000 });
  const name = (await pill.getAttribute('aria-label')) ?? '';
  if (name.endsWith('3D')) return;
  await pill.click();
  await page.getByRole('radio', { name: /^3D/ }).click();
  await expect(pill).toHaveAttribute('aria-label', /3D$/);
};

const detectAndPick = async (page: Page): Promise<Picked> => {
  await page.goto('/?tab=segments');
  await expect(page.getByTestId('segment-item').first()).toBeVisible({
    timeout: DETECTION_TIMEOUT_MS,
  });
  const sessionId = await latestSessionIdByName(page, FLAUCHER_EASY);
  const entries = (await readKv(page, { dbName: DB_NAME, store: 'segments' })) as StoredEntry[];
  const passed = entries
    .flatMap((entry) => entry.segments)
    .filter((segment) => segment.passes.some((pass) => pass.sessionId === sessionId));
  const picked = passed.find((segment) => segment.type !== 'route') ?? passed[0];
  if (picked === undefined) throw new Error(`no segment passed by ${sessionId}`);
  return { sessionId, segmentId: picked.id };
};

const setUp = async (page: Page) => {
  test.setTimeout(SCENE_TIMEOUT_MS);
  await prepare(page, 'en');
  await loadDemoData(page);
  return detectAndPick(page);
};

const sessionUrl = (picked: Picked, query = '') =>
  `/sessions/${encodeURIComponent(picked.sessionId)}${query}`;

const waitForSegmentPage = async (page: Page) => {
  await expect(page.getByTestId('pass-times-row')).toBeVisible({ timeout: DETECTION_TIMEOUT_MS });
  await expect(page.getByTestId('segment-explorer')).toBeVisible({ timeout: 60_000 });
};

const centerOnPhone = async (locator: Locator, device: Shot['device']) => {
  if (device !== 'p') return;
  await locator.evaluate((element) => element.scrollIntoView({ block: 'center' }));
};

const LOCALES = ['en', 'de'] as const;
const VIEWPORTS = { d: { width: 1280, height: 800 }, p: { width: 390, height: 844 } };

const shootAllHovered = async (
  page: Page,
  name: string,
  scene: (page: Page) => Promise<void>,
) => {
  const outDir = resolve(dirname(test.info().file), 'after');
  mkdirSync(outDir, { recursive: true });
  for (const locale of LOCALES) {
    for (const device of ['d', 'p'] as const) {
      await page.setViewportSize(VIEWPORTS[device]);
      await page.evaluate((value) => sessionStorage.setItem('wb-locale', value), locale);
      await page.reload();
      await scene(page);
      await page.waitForTimeout(CAMERA_SETTLE_MS);
      await page.screenshot({ path: resolve(outDir, `${device}-${locale}-${name}.png`) });
    }
  }
};

test('dashboard', async ({ page }) => {
  await setUp(page);
  await shootAll(page, 'dashboard', async (p) => {
    await p.goto('/');
  });
});

test('segments tab', async ({ page }) => {
  await setUp(page);
  await shootAll(page, 'segments-tab', async (p) => {
    await p.goto('/?tab=segments');
    await expect(p.getByTestId('segment-item').first()).toBeVisible({ timeout: 60_000 });
    await p.waitForTimeout(CAMERA_SETTLE_MS);
  });
});

test('session summary', async ({ page }) => {
  const picked = await setUp(page);
  await shootAll(page, 'session-summary', async (p) => {
    await p.goto(sessionUrl(picked));
    await expect(p.getByTestId('segments-row')).toBeVisible({ timeout: DETECTION_TIMEOUT_MS });
  });
});

test('session with the segments row expanded', async ({ page }) => {
  const picked = await setUp(page);
  await shootAll(page, 'session-segments-expanded', async (p, shot) => {
    await p.goto(sessionUrl(picked));
    const row = p.getByTestId('segments-row');
    await expect(row).toBeVisible({ timeout: DETECTION_TIMEOUT_MS });
    await row.getByRole('button').first().click();
    await expect(row.getByTestId('segment-item').first()).toBeVisible();
    await centerOnPhone(row.getByTestId('segment-item').nth(1), shot.device);
  });
});

test('segment page', async ({ page }) => {
  const picked = await setUp(page);
  await shootAll(page, 'segment-page', async (p) => {
    await p.goto(`/segments/${picked.segmentId}`);
    await waitForSegmentPage(p);
  });
});

test('segment page from a session', async ({ page }) => {
  const picked = await setUp(page);
  await shootAll(page, 'segment-page-from-session', async (p) => {
    await p.goto(`/segments/${picked.segmentId}?from=${encodeURIComponent(picked.sessionId)}`);
    await waitForSegmentPage(p);
  });
});

test('segment page with all passes shown', async ({ page }) => {
  const picked = await setUp(page);
  await shootAll(page, 'segment-page-passes-expanded', async (p, shot) => {
    await p.goto(`/segments/${picked.segmentId}`);
    await waitForSegmentPage(p);
    const toggle = p.getByTestId('pass-list').getByRole('button', { expanded: false });
    await toggle.click();
    await expect(p.getByTestId('pass-list').getByRole('button', { expanded: true })).toBeVisible();
    await centerOnPhone(p.getByTestId('pass-item').nth(2), shot.device);
  });
});

test('segment page with the explorer hovered', async ({ page }) => {
  const picked = await setUp(page);
  await shootAllHovered(page, 'segment-page-explorer-hover', async (p) => {
    await p.goto(`/segments/${picked.segmentId}`);
    await waitForSegmentPage(p);
    const surface = p.getByTestId('segment-explorer').locator('.recharts-surface').first();
    await expect(surface).toBeVisible({ timeout: 60_000 });
    const viewport = p.viewportSize();
    if (viewport !== null && viewport.width < VIEWPORTS.d.width) {
      await centerOnPhone(surface, 'p');
      await p.waitForTimeout(CAMERA_SETTLE_MS);
    }
    const box = await surface.boundingBox();
    if (box === null) throw new Error('explorer chart has no box');
    await p.mouse.move(box.x + box.width * 0.3, box.y + box.height / 2);
    await p.mouse.move(box.x + box.width * 0.55, box.y + box.height / 2, { steps: 8 });
  });
});

test('session segments row with all segments shown', async ({ page }) => {
  await setUp(page);
  const sessionId = await busiestSessionId(page);
  await shootAll(page, 'session-segments-show-more', async (p, shot) => {
    await p.goto(`/sessions/${encodeURIComponent(sessionId)}`);
    const row = p.getByTestId('segments-row');
    await expect(row).toBeVisible({ timeout: DETECTION_TIMEOUT_MS });
    await row.getByRole('button').first().click();
    await row.getByRole('button', { expanded: false }).last().click();
    await expect(row.getByRole('button', { expanded: true }).last()).toBeVisible();
    await centerOnPhone(row.getByTestId('segment-item').nth(5), shot.device);
  });
});

const hoverSessionSegment = async (p: Page, picked: Picked) => {
  const row = p.getByTestId('segments-row');
  await expect(row).toBeVisible({ timeout: DETECTION_TIMEOUT_MS });
  await row.getByRole('button').first().click();
  const item = row.getByTestId('segment-item').nth(2);
  await expect(item).toBeVisible();
  const viewport = p.viewportSize();
  if (viewport !== null && viewport.width < VIEWPORTS.d.width) await centerOnPhone(item, 'p');
  await p.waitForTimeout(CAMERA_SETTLE_MS);
  await item.hover();
  return picked;
};

test('session with a segment item hovered', async ({ page }) => {
  const picked = await setUp(page);
  await shootAllHovered(page, 'session-segment-hover', async (p) => {
    await p.goto(sessionUrl(picked));
    await hoverSessionSegment(p, picked);
  });
});

test('session with a segment item hovered in 3D', async ({ page }) => {
  const picked = await setUp(page);
  await shootAllHovered(page, 'session-segment-hover-3d', async (p) => {
    await p.goto(sessionUrl(picked));
    await switchMapTo3d(p);
    await p.waitForTimeout(CAMERA_SETTLE_MS);
    await hoverSessionSegment(p, picked);
  });
});

const openPickPopup = async (p: Page, args: { picked: Picked; device: Shot['device'] }) => {
  await p.goto('/?tab=segments');
  await expect(p.getByTestId('segment-item').first()).toBeVisible({ timeout: 60_000 });
  await p.waitForTimeout(CAMERA_SETTLE_MS);
  const point = await bandPointOnScreen(p, { segmentId: args.picked.segmentId, device: args.device });
  await p.mouse.click(point.x, point.y);
  const popup = p.locator('[data-radix-popper-content-wrapper]').getByRole('dialog');
  await expect(popup).toBeVisible({ timeout: 10_000 });
  return popup;
};

const deviceOf = (p: Page): Shot['device'] => {
  const viewport = p.viewportSize();
  if (viewport !== null && viewport.width < VIEWPORTS.d.width) return 'p';
  return 'd';
};

test('segments tab with a segment hovered', async ({ page }) => {
  await setUp(page);
  await shootAllHovered(page, 'segments-tab-hover', async (p) => {
    await p.goto('/?tab=segments');
    const nested = p.getByTestId('segment-item').nth(1);
    await expect(nested).toBeVisible({ timeout: 60_000 });
    await p.waitForTimeout(CAMERA_SETTLE_MS);
    await centerOnPhone(nested, deviceOf(p));
    await nested.hover();
  });
});

test('segments tab map pick popup', async ({ page }) => {
  const picked = await setUp(page);
  await shootAll(page, 'segments-tab-pick-popup', async (p, shot) => {
    await openPickPopup(p, { picked, device: shot.device });
  });
});

test('segments tab map pick popup with an item hovered', async ({ page }) => {
  const picked = await setUp(page);
  await shootAllHovered(page, 'segments-tab-pick-popup-hover', async (p) => {
    const popup = await openPickPopup(p, { picked, device: deviceOf(p) });
    await popup.getByTestId('segment-item').nth(1).hover();
  });
});
