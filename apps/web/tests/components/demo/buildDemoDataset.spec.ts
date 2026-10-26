import { beforeAll, describe, expect, it } from 'vite-plus/test';
import routesJson from '@/lib/demo/demoRoutes.json';
import {
  buildDemoDataset,
  DEMO_PERSONA,
  DEMO_SEED,
  type DemoDataset,
} from '@/components/demo/buildDemoDataset.ts';
import { parseDemoRoutes, type DemoRoutesJson } from '@/lib/demo/demoRecords.ts';
import {
  DEMO_WORKOUTS,
  FLAUCHER_EASY,
  GARDA_TRIP,
  ISAR_800S,
  STARNBERGER_LONG_RIDE,
  TEGERNSEE_LOOP,
} from '@/lib/demo/demoSchedule.ts';
import { haversineDistanceMeters } from '@pacevault/engine/geodesy.ts';
import { analyzeLaps, buildEffortLapSet, effortPattern } from '@/lib/analysis/laps.ts';
import { thresholdsAt } from '@/lib/analysis/thresholdsAt.ts';
import { sessionStressAt, sessionStressFromRecordsAt } from '@/lib/analysis/sessionStress.ts';
import type { UserProfile } from '@/types.ts';
import type { SessionRecord } from '@pacevault/engine/types.ts';
import { MS_PER_DAY, MS_PER_MINUTE } from '@pacevault/engine/time.ts';

const DEMO_BUILD_TIMEOUT_MS = MS_PER_MINUTE;
const HOME = { lat: 48.125, lng: 11.565 };
// A Wednesday afternoon, local time.
const TODAY = new Date(2026, 4, 20, 14, 30);
// EU daylight-saving switch (Sunday).
const DST_SUNDAY = new Date(2026, 2, 29, 12, 0);

const DELETED_SESSION_FIELDS = [
  'calories',
  'movingTime',
  'deviceTss',
  'deviceIf',
  'deviceFtp',
  'minAltitude',
  'maxAltitude',
  'avgAltitude',
  'maxPower',
];
const DELETED_LAP_FIELDS = [
  'avgSpeed',
  'maxSpeed',
  'totalAscent',
  'minAltitude',
  'maxAltitude',
  'avgAltitude',
  'avgHr',
  'avgCadence',
  'maxCadence',
  'repetitionNum',
  'totalElapsedTime',
];

const localMidnight = (date: Date): number =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

const recordsOf = (dataset: DemoDataset, sessionId: string): SessionRecord[] =>
  dataset.sessionData.find((d) => d.sessionId === sessionId)?.records ?? [];

const latestNamed = (dataset: DemoDataset, name: string) =>
  dataset.sessions.filter((s) => s.name === name).sort((a, b) => b.date - a.date)[0];

const trackLength = (records: SessionRecord[]): number => {
  let length = 0;
  let prev: { lat: number; lng: number } | undefined = undefined;
  for (const r of records) {
    if (r.lat === undefined || r.lng === undefined) continue;
    const point = { lat: r.lat, lng: r.lng };
    if (prev) length += haversineDistanceMeters({ from: prev, to: point });
    prev = point;
  }
  return length;
};

let routes: DemoRoutesJson;
let dataset: DemoDataset;

beforeAll(() => {
  const parsed = parseDemoRoutes(routesJson);
  if (!parsed) throw new Error('demoRoutes.json does not match its schema');
  routes = parsed;
  dataset = buildDemoDataset({ seed: DEMO_SEED, today: TODAY, routes });
}, DEMO_BUILD_TIMEOUT_MS);

describe(buildDemoDataset.name, () => {
  it(
    'is deterministic for the same seed and day, ids included',
    () => {
      const again = buildDemoDataset({ seed: DEMO_SEED, today: TODAY, routes });
      expect(again).toEqual(dataset);
    },
    DEMO_BUILD_TIMEOUT_MS,
  );

  it('places the plan in the past: last session 1–7 days ago, first ~52 weeks before it', () => {
    const midnight = localMidnight(TODAY);
    const dates = dataset.sessions.map((s) => s.date).sort((a, b) => a - b);
    const first = dates[0] ?? 0;
    const last = dates[dates.length - 1] ?? 0;

    expect(dates.filter((d) => !(d < midnight))).toEqual([]);
    const daysAgo = Math.round((midnight - localMidnight(new Date(last))) / MS_PER_DAY);
    expect(daysAgo).toBeGreaterThanOrEqual(1);
    expect(daysAgo).toBeLessThanOrEqual(7);
    const weeks = (last - first) / (7 * MS_PER_DAY);
    expect(weeks).toBeGreaterThanOrEqual(51);
    expect(weeks).toBeLessThanOrEqual(53);
  });

  it(
    'keeps weekdays and wall-clock start times when today is a DST-switch Sunday',
    () => {
      const dst = buildDemoDataset({ seed: DEMO_SEED, today: DST_SUNDAY, routes });
      const clock = (data: DemoDataset) =>
        data.sessions.map((s) => {
          const d = new Date(s.date);
          return `${d.getDay()} ${d.getHours()}:${d.getMinutes()}`;
        });
      expect(clock(dst)).toEqual(clock(dataset));
      const midnight = localMidnight(DST_SUNDAY);
      expect(dst.sessions.filter((s) => !(s.date < midnight))).toEqual([]);
    },
    DEMO_BUILD_TIMEOUT_MS,
  );

  it('draws every outdoor track as long as the session distance', () => {
    for (const session of dataset.sessions) {
      const records = recordsOf(dataset, session.id);
      if (!records.some((r) => r.lat !== undefined)) continue;
      const distance = session.distance ?? 0;
      expect(Math.abs(trackLength(records) - distance) / distance).toBeLessThan(0.01);
    }
  });

  it('has running sessions whose device laps form intervals', () => {
    const intervalRun = dataset.sessions.some((s) => {
      if (s.sport !== 'running') return false;
      const laps = dataset.sessionData.find((d) => d.sessionId === s.id)?.laps ?? [];
      return analyzeLaps(laps).some((l) => l.interval);
    });
    expect(intervalRun).toBe(true);
  });

  it('meets the README banner contract', () => {
    const midnight = localMidnight(TODAY);
    const reps = latestNamed(dataset, ISAR_800S);
    const easy = latestNamed(dataset, FLAUCHER_EASY);
    if (!reps || !easy) throw new Error('banner sessions missing');
    expect(midnight - reps.date).toBeLessThan(8 * 7 * MS_PER_DAY);
    expect(midnight - easy.date).toBeLessThan(8 * 7 * MS_PER_DAY);

    const repLaps = dataset.sessionData.find((d) => d.sessionId === reps.id)?.laps ?? [];
    expect(repLaps).toHaveLength(13);
    expect(repLaps[3]?.intensity).toBe('active');
    const zone3 = DEMO_PERSONA.restHr + (DEMO_PERSONA.maxHr - DEMO_PERSONA.restHr) * 0.7;
    expect(reps.maxHr ?? 0).toBeGreaterThanOrEqual(zone3);

    const easyLaps = dataset.sessionData.find((d) => d.sessionId === easy.id)?.laps ?? [];
    expect(easyLaps[0]?.distance).toBeCloseTo(1000, -1);
    expect(easy.gap).toBeDefined();

    const rides = dataset.sessions.filter(
      (s) => s.name === STARNBERGER_LONG_RIDE && midnight - s.date < 90 * MS_PER_DAY,
    );
    expect(rides.length).toBeGreaterThanOrEqual(2);
    expect(rides.filter((s) => !((s.distance ?? 0) >= 50_000))).toEqual([]);

    expect(dataset.studioRoutes.map((r) => r.name)).toContain(TEGERNSEE_LOOP);
  });

  it('has a point near HOME that tracks of at least 3 sessions, run and ride, pass within 20 m', () => {
    const CELL = 0.0002;
    const cellKey = (lat: number, lng: number) =>
      `${Math.floor(lat / CELL)}:${Math.floor(lng / (CELL * 1.5))}`;
    const cells = new Map<string, Set<string>>();
    const sportById = new Map(dataset.sessions.map((s) => [s.id, s.sport]));
    for (const entry of dataset.sessionData) {
      for (const r of entry.records) {
        if (r.lat === undefined || r.lng === undefined) continue;
        if (haversineDistanceMeters({ from: HOME, to: { lat: r.lat, lng: r.lng } }) > 1000)
          continue;
        const key = cellKey(r.lat, r.lng);
        const ids = cells.get(key) ?? new Set<string>();
        ids.add(entry.sessionId);
        cells.set(key, ids);
      }
    }
    const qualifies = [...cells.values()].some((ids) => {
      const sports = new Set([...ids].map((id) => sportById.get(id)));
      return ids.size >= 3 && sports.has('running') && sports.has('cycling');
    });
    expect(qualifies).toBe(true);
  });

  it('keeps missing data missing and stops as speed-0 data', () => {
    const noStrap = dataset.sessions.find((s) => s.sport === 'cycling' && s.avgHr === undefined);
    expect(noStrap?.stressMethod).toBe('tss');
    expect(recordsOf(dataset, noStrap?.id ?? '').filter((r) => r.hr !== undefined)).toEqual([]);

    const indoor = dataset.sessions.find((s) => s.subSport === 'treadmill');
    expect(recordsOf(dataset, indoor?.id ?? '').filter((r) => r.elevation !== undefined)).toEqual(
      [],
    );

    const cityRide = latestNamed(dataset, STARNBERGER_LONG_RIDE);
    const laps = dataset.sessionData.find((d) => d.sessionId === cityRide?.id)?.laps ?? [];
    expect(laps.filter((l) => (l.totalMovingTime ?? 0) < l.totalTimerTime)).not.toEqual([]);
  });

  it('sets no field that fit-data removed', () => {
    for (const session of dataset.sessions) {
      expect(Object.keys(session).filter((k) => DELETED_SESSION_FIELDS.includes(k))).toEqual([]);
    }
    for (const entry of dataset.sessionData) {
      for (const lap of entry.laps) {
        expect(Object.keys(lap).filter((k) => DELETED_LAP_FIELDS.includes(k))).toEqual([]);
      }
    }
  });

  const effortsOf = (session: DemoDataset['sessions'][number]) =>
    buildEffortLapSet({
      records: recordsOf(dataset, session.id),
      sport: session.sport,
      thresholds: thresholdsAt({ profile: dataset.profile, date: session.date }),
    }).set;

  it(
    'shows three efforts of one pattern on every sweet spot ride, none on the Garda rides',
    () => {
      const sweetSpots = dataset.sessions.filter(
        (s) => s.name === DEMO_WORKOUTS.indoorSweetSpot.name,
      );
      expect(sweetSpots.length).toBeGreaterThan(0);
      for (const session of sweetSpots) {
        const set = effortsOf(session);
        if (!set) throw new Error(`no efforts on ${new Date(session.date).toISOString()}`);
        expect(effortPattern(set)?.count).toBe(3);
      }

      const gardaIds = new Set(dataset.trips.find((t) => t.name === GARDA_TRIP)?.sessionIds);
      const gardaRides = dataset.sessions.filter(
        (s) => gardaIds.has(s.id) && s.sport === 'cycling',
      );
      expect(gardaRides.length).toBeGreaterThan(0);
      for (const session of gardaRides) expect(effortsOf(session)).toBeNull();
    },
    DEMO_BUILD_TIMEOUT_MS,
  );

  it('scores rides from power and runs from heart rate', () => {
    for (const session of dataset.sessions) {
      if (session.sport === 'cycling') expect(session.stressMethod).toBe('tss');
      if (session.sport === 'running') expect(session.stressMethod).toBe('trimp');
    }
  });

  it('stores the loads the training load recompute computes', () => {
    const profile: UserProfile = { ...dataset.profile, id: 'demo', createdAt: 0 };
    for (const session of dataset.sessions) {
      const stored = {
        tss: session.tss,
        stressMethod: session.stressMethod,
        normalizedPower: session.normalizedPower,
      };
      expect(
        sessionStressFromRecordsAt({ session, records: recordsOf(dataset, session.id), profile }),
      ).toEqual(stored);
      if (session.sport === 'cycling')
        expect(sessionStressAt({ session, profile })).toEqual(stored);
    }
  });
});
