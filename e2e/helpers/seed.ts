import { v4 } from 'uuid';
import { type Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Must match DB_NAME / DB_VERSION in src/lib/db.ts. */
const DB = { name: 'endurance-tracker', version: 4 };

/**
 * Writes Zustand persist entries into IndexedDB's kv store, creating the full
 * app schema on the way (single source of truth for the seeded DB shape).
 *
 * Must be called AFTER page.goto (needs an origin) and BEFORE the app reads
 * state — reload the page afterwards so stores rehydrate from IDB.
 */
const writeKvEntries = async (page: Page, entries: Record<string, string>) => {
  await page.evaluate(
    async ({
      db,
      entries,
    }: {
      db: { name: string; version: number };
      entries: Record<string, string>;
    }) => {
      const openReq = indexedDB.open(db.name, db.version);
      await new Promise<void>((resolve, reject) => {
        openReq.onupgradeneeded = () => {
          const idb = openReq.result;
          if (!idb.objectStoreNames.contains('kv')) idb.createObjectStore('kv');
          if (!idb.objectStoreNames.contains('session-records'))
            idb.createObjectStore('session-records', { keyPath: 'sessionId' });
          if (!idb.objectStoreNames.contains('session-laps'))
            idb.createObjectStore('session-laps', { keyPath: 'sessionId' });
          if (!idb.objectStoreNames.contains('session-gps')) {
            const gps = idb.createObjectStore('session-gps', { autoIncrement: true });
            gps.createIndex('sessionId', 'sessionId', { unique: false });
          }
          if (!idb.objectStoreNames.contains('fit-files'))
            idb.createObjectStore('fit-files', { keyPath: 'sessionId' });
          if (!idb.objectStoreNames.contains('session-weather'))
            idb.createObjectStore('session-weather', { keyPath: 'sessionId' });
          if (!idb.objectStoreNames.contains('studio-route-points'))
            idb.createObjectStore('studio-route-points', { keyPath: 'routeId' });
        };
        openReq.onsuccess = () => {
          const idb = openReq.result;
          const tx = idb.transaction('kv', 'readwrite');
          const store = tx.objectStore('kv');
          for (const [key, value] of Object.entries(entries)) {
            store.put(value, key);
          }
          tx.oncomplete = () => {
            idb.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
        openReq.onerror = () => reject(openReq.error);
      });
    },
    { db: DB, entries },
  );
};

const layoutState = () =>
  JSON.stringify({
    state: { onboardingComplete: true },
    version: 3,
  });

const userState = (profileId: string, thresholds: Record<string, number>) =>
  JSON.stringify({
    state: {
      profile: {
        id: profileId,
        gender: 'male',
        thresholds,
        showMetricHelp: true,
        useAutoSessionNames: false,
        createdAt: Date.now(),
      },
    },
    version: 1,
  });

const sessionsState = (sessions: unknown[]) =>
  JSON.stringify({
    state: { sessions, personalBests: [] },
    version: 1,
  });

/**
 * Seeds the app past onboarding by writing directly to IndexedDB's kv store,
 * which is where Zustand persists its state.
 */
export const seedOnboardingComplete = async (page: Page) => {
  await page.goto('/');
  await writeKvEntries(page, {
    'store-layout': layoutState(),
    'store-user': userState(v4(), { restHr: 50, maxHr: 185 }),
    'store-sessions': sessionsState([]),
  });
  // Reload so the app rehydrates from the seeded IDB state
  await page.reload();
};

/**
 * Minimal session shape matching TrainingSession — only the fields
 * the session list actually reads for rendering and filtering.
 */
interface SeedSession {
  sport: 'running' | 'cycling';
  date: number;
  name?: string;
  duration?: number;
  distance?: number;
  elevationGain?: number;
}

/**
 * Seeds onboarding + pre-built sessions directly into IDB so tests
 * can start with a known set of sessions without uploading FIT files.
 */
export const seedWithSessions = async (page: Page, sessions: SeedSession[]) => {
  await page.goto('/');

  const now = Date.now();
  const sessionIds = sessions.map(() => v4());
  const builtSessions = sessions.map((s, i) => ({
    id: sessionIds[i],
    sport: s.sport,
    date: s.date,
    name: s.name,
    duration: s.duration ?? 3600,
    distance: s.distance ?? 10000,
    elevationGain: s.elevationGain ?? 0,
    tss: 80,
    stressMethod: 'trimp',
    sensorWarnings: [],
    isPlanned: false,
    hasDetailedRecords: false,
    createdAt: now,
  }));

  const filtersState = JSON.stringify({
    state: {
      timeRange: 'all',
      customRange: null,
      prevDashboardRange: null,
      sportFilter: 'all',
    },
    version: 1,
  });

  await writeKvEntries(page, {
    'store-layout': layoutState(),
    'store-user': userState(v4(), { restHr: 50, maxHr: 185 }),
    'store-sessions': sessionsState(builtSessions),
    'store-filters': filtersState,
  });

  await page.reload();
  return sessionIds;
};

/**
 * Seeds trips into IDB's kv store (the `store-trips` Zustand key).
 * Call AFTER seeding sessions, then the page reloads to rehydrate.
 */
export const seedTrips = async (
  page: Page,
  trips: { name: string; description?: string; sessionIds: string[] }[],
) => {
  const now = Date.now();
  const tripsState = JSON.stringify({
    state: {
      trips: trips.map((t, i) => ({
        id: `trip-${i}`,
        name: t.name,
        description: t.description,
        sessionIds: t.sessionIds,
        createdAt: now,
      })),
    },
    version: 1,
  });

  await writeKvEntries(page, { 'store-trips': tripsState });

  await page.reload();
};

interface SeedCoachSession {
  sport: 'running' | 'cycling';
  date: number;
  tss?: number;
}

/**
 * Seeds onboarding + a user profile with thresholdPace + pre-built sessions
 * directly into IDB so coach plan tests can start with a known state.
 *
 * Also clears store-coach-plan to prevent stale cache between tests.
 */
export const seedCoachWithThresholdPace = async (
  page: Page,
  thresholdPace: number,
  sessions: SeedCoachSession[],
) => {
  await page.goto('/');

  const now = Date.now();
  const sessionIds = sessions.map(() => v4());
  const builtSessions = sessions.map((s, i) => ({
    id: sessionIds[i],
    sport: s.sport,
    date: s.date,
    duration: 3600,
    distance: 10000,
    tss: s.tss ?? 80,
    stressMethod: 'trimp',
    sensorWarnings: [],
    isPlanned: false,
    hasDetailedRecords: false,
    createdAt: now,
  }));

  const coachPlanState = JSON.stringify({
    state: { cachedPlan: null, cacheKey: null },
    version: 1,
  });

  await writeKvEntries(page, {
    'store-layout': layoutState(),
    'store-user': userState(v4(), { restHr: 50, maxHr: 185, thresholdPace }),
    'store-sessions': sessionsState(builtSessions),
    'store-coach-plan': coachPlanState,
  });

  await page.reload();
};

export const FIXTURES_DIR = path.resolve(__dirname, '../fixtures');
export const CYCLING_FIT = path.join(FIXTURES_DIR, 'cycling.fit');
export const RUNNING_FIT = path.join(FIXTURES_DIR, 'running.fit');
export const CYCLING_ONLY_ZIP = path.join(FIXTURES_DIR, 'cycling-only.zip');
export const ACTIVITIES_ZIP = path.join(FIXTURES_DIR, 'activities.zip');
