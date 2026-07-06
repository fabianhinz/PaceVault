import { v4 } from 'uuid';
import { type Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Seeds the app past onboarding by writing directly to IndexedDB's kv store,
 * which is where Zustand persists its state.
 *
 * Must be called BEFORE navigating to the app (or after clearing state),
 * then the page must be reloaded for stores to rehydrate from IDB.
 */
export const seedOnboardingComplete = async (page: Page) => {
  await page.goto('/');

  const profileId = v4();
  await page.evaluate(async (profileId: string) => {
    const now = Date.now();

    const layoutState = JSON.stringify({
      state: {
        onboardingComplete: true,
      },
      version: 3,
    });

    const userState = JSON.stringify({
      state: {
        profile: {
          id: profileId,
          gender: 'male',
          thresholds: { restHr: 50, maxHr: 185 },
          showMetricHelp: true,
          useAutoSessionNames: false,
          createdAt: now,
        },
      },
      version: 1,
    });

    const sessionsState = JSON.stringify({
      state: {
        sessions: [],
        personalBests: [],
      },
      version: 1,
    });

    // Open IDB and write store keys
    const openReq = indexedDB.open('endurance-tracker', 3);
    await new Promise<void>((resolve, reject) => {
      openReq.onupgradeneeded = () => {
        const db = openReq.result;
        if (!db.objectStoreNames.contains('kv')) {
          db.createObjectStore('kv');
        }
        if (!db.objectStoreNames.contains('session-records')) {
          db.createObjectStore('session-records', { keyPath: 'sessionId' });
        }
        if (!db.objectStoreNames.contains('session-laps')) {
          db.createObjectStore('session-laps', { keyPath: 'sessionId' });
        }
        if (!db.objectStoreNames.contains('session-gps')) {
          const gps = db.createObjectStore('session-gps', { autoIncrement: true });
          gps.createIndex('sessionId', 'sessionId', { unique: false });
        }
        if (!db.objectStoreNames.contains('fit-files')) {
          db.createObjectStore('fit-files', { keyPath: 'sessionId' });
        }
        if (!db.objectStoreNames.contains('session-weather')) {
          db.createObjectStore('session-weather', { keyPath: 'sessionId' });
        }
      };
      openReq.onsuccess = () => {
        const db = openReq.result;
        const tx = db.transaction('kv', 'readwrite');
        const store = tx.objectStore('kv');
        store.put(layoutState, 'store-layout');
        store.put(userState, 'store-user');
        store.put(sessionsState, 'store-sessions');
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
      openReq.onerror = () => reject(openReq.error);
    });
  }, profileId);

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

  const profileId = v4();
  const sessionIds = sessions.map(() => v4());
  await page.evaluate(
    async ({
      sessions,
      profileId,
      sessionIds,
    }: {
      sessions: SeedSession[];
      profileId: string;
      sessionIds: string[];
    }) => {
      const now = Date.now();

      const layoutState = JSON.stringify({
        state: {
          onboardingComplete: true,
        },
        version: 3,
      });

      const userState = JSON.stringify({
        state: {
          profile: {
            id: profileId,
            gender: 'male',
            thresholds: { restHr: 50, maxHr: 185 },
            showMetricHelp: true,
            useAutoSessionNames: false,
            createdAt: now,
          },
        },
        version: 1,
      });

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

      const sessionsState = JSON.stringify({
        state: {
          sessions: builtSessions,
          personalBests: [],
        },
        version: 1,
      });

      const filtersState = JSON.stringify({
        state: {
          timeRange: 'all',
          customRange: null,
          prevDashboardRange: null,
          sportFilter: 'all',
        },
        version: 1,
      });

      const openReq = indexedDB.open('endurance-tracker', 3);
      await new Promise<void>((resolve, reject) => {
        openReq.onupgradeneeded = () => {
          const db = openReq.result;
          if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
          if (!db.objectStoreNames.contains('session-records'))
            db.createObjectStore('session-records', { keyPath: 'sessionId' });
          if (!db.objectStoreNames.contains('session-laps'))
            db.createObjectStore('session-laps', { keyPath: 'sessionId' });
          if (!db.objectStoreNames.contains('session-gps')) {
            const gps = db.createObjectStore('session-gps', { autoIncrement: true });
            gps.createIndex('sessionId', 'sessionId', { unique: false });
          }
          if (!db.objectStoreNames.contains('fit-files'))
            db.createObjectStore('fit-files', { keyPath: 'sessionId' });
          if (!db.objectStoreNames.contains('session-weather'))
            db.createObjectStore('session-weather', { keyPath: 'sessionId' });
        };
        openReq.onsuccess = () => {
          const db = openReq.result;
          const tx = db.transaction('kv', 'readwrite');
          const store = tx.objectStore('kv');
          store.put(layoutState, 'store-layout');
          store.put(userState, 'store-user');
          store.put(sessionsState, 'store-sessions');
          store.put(filtersState, 'store-filters');
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
        openReq.onerror = () => reject(openReq.error);
      });
    },
    { sessions, profileId, sessionIds },
  );

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
  await page.evaluate(async (trips) => {
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

    const openReq = indexedDB.open('endurance-tracker', 3);
    await new Promise<void>((resolve, reject) => {
      openReq.onsuccess = () => {
        const db = openReq.result;
        const tx = db.transaction('kv', 'readwrite');
        tx.objectStore('kv').put(tripsState, 'store-trips');
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
      openReq.onerror = () => reject(openReq.error);
    });
  }, trips);

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

  const coachProfileId = v4();
  const coachSessionIds = sessions.map(() => v4());
  await page.evaluate(
    async ({
      thresholdPace,
      sessions,
      profileId,
      sessionIds,
    }: {
      thresholdPace: number;
      sessions: SeedCoachSession[];
      profileId: string;
      sessionIds: string[];
    }) => {
      const now = Date.now();

      const layoutState = JSON.stringify({
        state: { onboardingComplete: true },
        version: 3,
      });

      const userState = JSON.stringify({
        state: {
          profile: {
            id: profileId,
            gender: 'male',
            thresholds: { restHr: 50, maxHr: 185, thresholdPace },
            showMetricHelp: true,
            useAutoSessionNames: false,
            createdAt: now,
          },
        },
        version: 1,
      });

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

      const sessionsState = JSON.stringify({
        state: { sessions: builtSessions, personalBests: [] },
        version: 1,
      });

      const coachPlanState = JSON.stringify({
        state: { cachedPlan: null, cacheKey: null },
        version: 1,
      });

      const openReq = indexedDB.open('endurance-tracker', 3);
      await new Promise<void>((resolve, reject) => {
        openReq.onupgradeneeded = () => {
          const db = openReq.result;
          if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
          if (!db.objectStoreNames.contains('session-records'))
            db.createObjectStore('session-records', { keyPath: 'sessionId' });
          if (!db.objectStoreNames.contains('session-laps'))
            db.createObjectStore('session-laps', { keyPath: 'sessionId' });
          if (!db.objectStoreNames.contains('session-gps')) {
            const gps = db.createObjectStore('session-gps', { autoIncrement: true });
            gps.createIndex('sessionId', 'sessionId', { unique: false });
          }
          if (!db.objectStoreNames.contains('fit-files'))
            db.createObjectStore('fit-files', { keyPath: 'sessionId' });
          if (!db.objectStoreNames.contains('session-weather'))
            db.createObjectStore('session-weather', { keyPath: 'sessionId' });
        };
        openReq.onsuccess = () => {
          const db = openReq.result;
          const tx = db.transaction('kv', 'readwrite');
          const store = tx.objectStore('kv');
          store.put(layoutState, 'store-layout');
          store.put(userState, 'store-user');
          store.put(sessionsState, 'store-sessions');
          store.put(coachPlanState, 'store-coach-plan');
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
        openReq.onerror = () => reject(openReq.error);
      });
    },
    { thresholdPace, sessions, profileId: coachProfileId, sessionIds: coachSessionIds },
  );

  await page.reload();
};

export const FIXTURES_DIR = path.resolve(__dirname, '../fixtures');
export const CYCLING_FIT = path.join(FIXTURES_DIR, 'cycling.fit');
export const RUNNING_FIT = path.join(FIXTURES_DIR, 'running.fit');
export const CYCLING_ONLY_ZIP = path.join(FIXTURES_DIR, 'cycling-only.zip');
export const ACTIVITIES_ZIP = path.join(FIXTURES_DIR, 'activities.zip');
