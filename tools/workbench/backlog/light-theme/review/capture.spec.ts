// Review capture for the light theme. Every screen is shot once per theme: <screen>-dark and
// <screen>-light. The theme is set through localStorage['pacevault-theme'] before the app loads;
// the code before the item ignores the key, so both "before" variants render dark.
// Run: vp run workbench:capture -- tools/workbench/backlog/light-theme/review
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import {
  expect,
  loadDemoData,
  prepare,
  shootAll,
  test,
  type Locale,
  type Page,
  type Shot,
} from '../../../shared/capture';
import { exposeMap } from '../../../../../apps/web/e2e/helpers/map.ts';

const THEMES = ['dark', 'light'] as const;
type Theme = (typeof THEMES)[number];
const THEME_KEY = 'pacevault-theme';
const THEME_OVERRIDE_KEY = 'wb-theme'; // sessionStorage, survives the reload in shootAll
const SCREEN_TIMEOUT_MS = 480_000;
const MATCHING_TIMEOUT_MS = 90_000;
const CHART_DRAW_IN_MS = 2_000;

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../..');
const messagesSchema = z.record(z.string(), z.unknown());
const t = (locale: Locale, key: string) => {
  const messages = messagesSchema.parse(
    JSON.parse(readFileSync(resolve(repoRoot, 'packages/i18n/messages', `${locale}.json`), 'utf8')),
  );
  const value = messages[key];
  if (typeof value !== 'string') throw new Error(`message "${key}" is not a plain string`);
  return value;
};

/** Reads one store's state from the dev server's module graph. */
const storeState = (page: Page, store: { module: string; hook: string }) =>
  page.evaluate(async (args) => {
    const storeModule = await import(/* @vite-ignore */ args.module);
    return JSON.parse(JSON.stringify(Reflect.get(storeModule, args.hook).getState())) as unknown;
  }, store);

const sessionsSchema = z.object({
  sessions: z.array(
    z.looseObject({
      id: z.string(),
      sport: z.string(),
      date: z.number(),
      elevationGain: z.number().optional(),
    }),
  ),
});
const tripsSchema = z.object({
  trips: z.array(z.looseObject({ name: z.string(), sessionIds: z.array(z.string()) })),
});
const GARDA_TRIP = 'Lake Garda';
const studioSchema = z.object({ routes: z.array(z.looseObject({ id: z.string() })) });

const latestRunningSessionId = async (page: Page) => {
  const state = sessionsSchema.parse(
    await storeState(page, { module: '/src/store/sessions.ts', hook: 'useSessionsStore' }),
  );
  const runs = state.sessions
    .filter((session) => session.sport === 'running')
    .toSorted((a, b) => b.date - a.date);
  const latest = runs[0];
  if (latest === undefined) throw new Error('demo data has no running session');
  return latest.id;
};

/** The demo's Lake Garda session with the most climbing, so 3D shows relief and hillshade. */
const gardaClimbSessionId = async (page: Page) => {
  const trips = tripsSchema.parse(
    await storeState(page, { module: '/src/store/trips.ts', hook: 'useTripsStore' }),
  );
  const garda = trips.trips.find((trip) => trip.name === GARDA_TRIP);
  if (garda === undefined) throw new Error('demo data has no Lake Garda trip');
  const state = sessionsSchema.parse(
    await storeState(page, { module: '/src/store/sessions.ts', hook: 'useSessionsStore' }),
  );
  const climbs = state.sessions
    .filter((session) => garda.sessionIds.includes(session.id))
    .toSorted((a, b) => (b.elevationGain ?? -1) - (a.elevationGain ?? -1));
  const steepest = climbs[0];
  if (steepest === undefined) throw new Error('the Lake Garda trip has no session');
  return steepest.id;
};

const firstStudioRouteId = async (page: Page) => {
  const state = studioSchema.parse(
    await storeState(page, { module: '/src/store/studio.ts', hook: 'useStudioStore' }),
  );
  const route = state.routes[0];
  if (route === undefined) throw new Error('demo data has no studio route');
  return route.id;
};

// Registered once per page; reads the override shootAllThemes writes before each round.
const prepareTheme = async (page: Page) => {
  await page.addInitScript(
    (args) => {
      const theme = sessionStorage.getItem(args.overrideKey);
      if (theme !== null) localStorage.setItem(args.themeKey, theme);
    },
    { overrideKey: THEME_OVERRIDE_KEY, themeKey: THEME_KEY },
  );
};

/** shootAll once per theme: <name>-dark, then <name>-light. */
const shootAllThemes = async (
  page: Page,
  name: string,
  scene: (page: Page, shot: Shot & { theme: Theme }) => Promise<void>,
) => {
  for (const theme of THEMES) {
    await page.evaluate((args) => sessionStorage.setItem(args.key, args.theme), {
      key: THEME_OVERRIDE_KEY,
      theme,
    });
    await shootAll(page, `${name}-${theme}`, (p, shot) => scene(p, { ...shot, theme }));
  }
};

const setUp = async (page: Page) => {
  test.setTimeout(SCREEN_TIMEOUT_MS);
  await prepare(page, 'en');
  await prepareTheme(page);
  await loadDemoData(page);
};

const waitForMap = async (page: Page) => {
  await expect(page.locator('.maplibregl-map').first()).toBeVisible({ timeout: 30_000 });
};

const openSession = async (page: Page, sessionId: string) => {
  await page.goto(`/sessions/${sessionId}`);
  await expect(page.getByTestId('map-view-pill')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('.recharts-wrapper').first()).toBeVisible({ timeout: 30_000 });
  // Recharts draws its lines in with a JS animation that settle() does not see.
  await page.waitForTimeout(CHART_DRAW_IN_MS);
};

test('dashboard map with the demo tracks', async ({ page }) => {
  await setUp(page);
  await shootAllThemes(page, 'dashboard', async (p) => {
    await p.goto('/');
    await waitForMap(p);
    await expect(p.locator('[data-layout="dock"]')).toBeVisible({ timeout: 30_000 });
  });
});

test('sessions list', async ({ page }) => {
  await setUp(page);
  await shootAllThemes(page, 'sessions', async (p) => {
    await p.goto('/sessions');
    await expect(p.getByTestId('session-item').first()).toBeVisible({ timeout: 30_000 });
  });
});

test('session detail in 2D with charts', async ({ page }) => {
  await setUp(page);
  const sessionId = await latestRunningSessionId(page);
  await shootAllThemes(page, 'session-detail', async (p) => {
    await openSession(p, sessionId);
  });
});

test('session detail with one lap selected', async ({ page }) => {
  await setUp(page);
  const sessionId = await latestRunningSessionId(page);
  await shootAllThemes(page, 'session-lap', async (p) => {
    await openSession(p, sessionId);
    await p.getByTestId('laps-row').locator(':scope > button').click();
    await p.getByTestId('lap-strip-bar').nth(1).click();
    await expect(p.getByTestId('lap-strip-selected')).toBeAttached();
    await expect(p.getByTestId('lap-stepper')).toBeVisible();
  });
});

test('session detail in 3D terrain', async ({ page }) => {
  await setUp(page);
  const sessionId = await gardaClimbSessionId(page);
  await shootAllThemes(page, 'session-3d', async (p, shot) => {
    await openSession(p, sessionId);
    const pill = p.getByTestId('map-view-pill');
    await pill.click();
    await p.getByRole('radio', { name: new RegExp(`^${t(shot.locale, 'ui_map_view_3d')}`) }).click();
    await expect(pill).toHaveAccessibleName(
      new RegExp(`${t(shot.locale, 'ui_map_view_3d')}$`),
    );
    await exposeMap(p);
    // The tilt eases in and terrain tiles stream in after it; shoot the idle, tilted map.
    await expect
      .poll(
        () =>
          p.evaluate(() => {
            const map = Reflect.get(window, '__map');
            return Math.round(map.getPitch()) > 0 && !map.isMoving() && map.areTilesLoaded();
          }),
        { timeout: 30_000 },
      )
      .toBe(true);
    // The entry tilt never reaches the horizon; tilt to the map's maximum so the sky shows. The
    // app's own terrain fit eases back to the entry tilt once the DEM settles, so re-tilt until the
    // maximum holds on an idle map.
    await expect
      .poll(
        () =>
          p.evaluate(() => {
            const map = Reflect.get(window, '__map');
            if (map.isMoving()) return false;
            if (Math.round(map.getPitch()) !== map.getMaxPitch()) {
              map.jumpTo({ pitch: map.getMaxPitch() });
              return false;
            }
            return map.areTilesLoaded();
          }),
        { timeout: 30_000, intervals: [2_000] },
      )
      .toBe(true);
  });
});

test('settings general tab', async ({ page }) => {
  await setUp(page);
  await shootAllThemes(page, 'settings', async (p) => {
    await p.goto('/settings?tab=general');
    await expect(p.getByRole('tabpanel')).toBeVisible({ timeout: 30_000 });
  });
});

test('records', async ({ page }) => {
  await setUp(page);
  await shootAllThemes(page, 'records', async (p) => {
    await p.goto('/sessions?tab=records');
    await expect(p.getByRole('tabpanel').locator('a[href^="/sessions/"]').first()).toBeVisible({
      timeout: 30_000,
    });
  });
});

test('trips', async ({ page }) => {
  await setUp(page);
  await shootAllThemes(page, 'trips', async (p) => {
    await p.goto('/sessions?tab=trips');
    await expect(p.getByRole('tabpanel').getByRole('button').first()).toBeVisible({
      timeout: 30_000,
    });
  });
});

test('segment detail with passes', async ({ page }) => {
  await setUp(page);
  const sessionId = await latestRunningSessionId(page);
  await openSession(page, sessionId);
  await page.getByRole('button', { name: 'Session actions' }).click();
  await page.getByRole('menuitem', { name: 'Use as reference segment' }).click();
  await expect(page.getByRole('textbox', { name: 'Name' })).not.toHaveValue('');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page).toHaveURL(/\/segments\//);
  await expect(page.getByRole('group', { name: 'Passes' })).toBeVisible({
    timeout: MATCHING_TIMEOUT_MS,
  });
  const segmentPath = new URL(page.url()).pathname;
  await shootAllThemes(page, 'segment', async (p) => {
    await p.goto(segmentPath);
    await expect(p.getByTestId('segment-header')).toBeVisible({ timeout: 30_000 });
    await expect(p.getByTestId('segment-header')).toContainText(/\d/, {
      timeout: MATCHING_TIMEOUT_MS,
    });
  });
});

test('studio route detail', async ({ page }) => {
  await setUp(page);
  const routeId = await firstStudioRouteId(page);
  await shootAllThemes(page, 'studio', async (p) => {
    await p.goto(`/studio/${routeId}`);
    await expect(p.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 30_000 });
    await waitForMap(p);
  });
});

test('labs training', async ({ page }) => {
  await setUp(page);
  await shootAllThemes(page, 'labs', async (p) => {
    await p.goto('/labs?tab=training');
    await expect(p.getByRole('tabpanel')).toBeVisible({ timeout: 30_000 });
  });
});

test('delete dialog over the session map', async ({ page }) => {
  await setUp(page);
  const sessionId = await latestRunningSessionId(page);
  await shootAllThemes(page, 'dialog', async (p, shot) => {
    await openSession(p, sessionId);
    await p.getByRole('button', { name: t(shot.locale, 'ui_session_actions') }).click();
    await p.getByRole('menuitem', { name: t(shot.locale, 'ui_btn_delete') }).click();
    await expect(
      p.getByRole('dialog', { name: t(shot.locale, 'ui_session_delete_title') }),
    ).toBeVisible();
  });
});
