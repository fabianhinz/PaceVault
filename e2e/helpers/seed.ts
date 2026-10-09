import { v4 } from 'uuid';
import { type Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { SESSION_DERIVATION_VERSION } from '../../src/packages/engine/sessionDerivation.ts';
import { DB_NAME, DB_VERSION } from '../../src/lib/db.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB = { name: DB_NAME, version: DB_VERSION };

const blockBasemap = async (page: Page) => {
  await page.route('**/*.cartocdn.com/**', (route) => route.abort());
};

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

export const seedOnboardingComplete = async (page: Page) => {
  await blockBasemap(page);
  await page.goto('/');
  await writeKvEntries(page, {
    'store-layout': layoutState(),
    'store-user': userState(v4(), { restHr: 50, maxHr: 185 }),
    'store-sessions': sessionsState([]),
  });
  await page.reload();
};

const intervalsState = (importedActivityIds: string[] = []) =>
  JSON.stringify({
    state: {
      apiKey: 'e2e-test-key',
      importedActivityIds,
    },
    version: 1,
  });

export const seedIntervalsConnected = async (
  page: Page,
  options?: { importedActivityIds?: string[]; intervalsSessionDates?: number[] },
) => {
  await blockBasemap(page);
  await page.goto('/');
  const sessions = (options?.intervalsSessionDates ?? []).map((date, i) => ({
    id: v4(),
    sport: 'running',
    date,
    duration: 3600,
    distance: 10000,
    tss: 80,
    stressMethod: 'trimp',
    isPlanned: false,
    hasDetailedRecords: false,
    derivationVersion: SESSION_DERIVATION_VERSION,
    createdAt: Date.now(),
    source: { kind: 'intervals', activityId: `seed${i}` },
  }));
  await writeKvEntries(page, {
    'store-layout': layoutState(),
    'store-user': userState(v4(), { restHr: 50, maxHr: 185 }),
    'store-sessions': sessionsState(sessions),
    'store-intervals': intervalsState(options?.importedActivityIds ?? []),
  });
  await page.reload();
};

interface SeedSession {
  sport: 'running' | 'cycling';
  date: number;
  name?: string;
  duration?: number;
  distance?: number;
  elevationGain?: number;
}

export const seedWithSessions = async (page: Page, sessions: SeedSession[]) => {
  await blockBasemap(page);
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
    elevationGain: s.elevationGain,
    tss: 80,
    stressMethod: 'trimp',
    isPlanned: false,
    hasDetailedRecords: false,
    derivationVersion: SESSION_DERIVATION_VERSION,
    createdAt: now,
  }));

  const filtersState = JSON.stringify({
    state: { activeFilter: null },
    version: 3,
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

export const seedCoachWithThresholdPace = async (
  page: Page,
  thresholdPace: number,
  sessions: SeedCoachSession[],
) => {
  await blockBasemap(page);
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
    isPlanned: false,
    hasDetailedRecords: false,
    derivationVersion: SESSION_DERIVATION_VERSION,
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
