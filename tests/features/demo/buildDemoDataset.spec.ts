import { beforeAll, describe, expect, it } from 'vite-plus/test';
import routesJson from '@/features/demo/demoRoutes.json';
import {
  buildDemoDataset,
  DEMO_PERSONA,
  DEMO_SEED,
  type DemoDataset,
} from '@/features/demo/buildDemoDataset.ts';
import { parseDemoRoutes, type DemoRoutesJson } from '@/features/demo/demoRecords.ts';
import {
  FLAUCHER_EASY,
  ISAR_800S,
  STARNBERGER_LONG_RIDE,
  TEGERNSEE_LOOP,
} from '@/features/demo/demoSchedule.ts';
import { haversineM } from '@/packages/engine/gps.ts';
import { analyzeLaps } from '@/lib/laps.ts';
import type { SessionRecord } from '@/packages/engine/types.ts';

const DAY_MS = 24 * 60 * 60 * 1000;
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
    if (prev) length += haversineM(prev, point);
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
}, 60_000);

describe('buildDemoDataset', () => {
  it('is deterministic for the same seed and day, ids included', () => {
    const again = buildDemoDataset({ seed: DEMO_SEED, today: TODAY, routes });
    expect(again).toEqual(dataset);
  }, 60_000);

  it('places the plan in the past: last session 1–7 days ago, first ~52 weeks before it', () => {
    const midnight = localMidnight(TODAY);
    const dates = dataset.sessions.map((s) => s.date).sort((a, b) => a - b);
    const first = dates[0] ?? 0;
    const last = dates[dates.length - 1] ?? 0;

    expect(dates.every((d) => d < midnight)).toBe(true);
    const daysAgo = Math.round((midnight - localMidnight(new Date(last))) / DAY_MS);
    expect(daysAgo).toBeGreaterThanOrEqual(1);
    expect(daysAgo).toBeLessThanOrEqual(7);
    const weeks = (last - first) / (7 * DAY_MS);
    expect(weeks).toBeGreaterThanOrEqual(51);
    expect(weeks).toBeLessThanOrEqual(53);
  });

  it('keeps weekdays and wall-clock start times when today is a DST-switch Sunday', () => {
    const dst = buildDemoDataset({ seed: DEMO_SEED, today: DST_SUNDAY, routes });
    const clock = (data: DemoDataset) =>
      data.sessions.map((s) => {
        const d = new Date(s.date);
        return `${d.getDay()} ${d.getHours()}:${d.getMinutes()}`;
      });
    expect(clock(dst)).toEqual(clock(dataset));
    const midnight = localMidnight(DST_SUNDAY);
    expect(dst.sessions.every((s) => s.date < midnight)).toBe(true);
  }, 60_000);

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
      return analyzeLaps(laps).some((l) => l.isInterval);
    });
    expect(intervalRun).toBe(true);
  });

  it('meets the README banner contract', () => {
    const midnight = localMidnight(TODAY);
    const reps = latestNamed(dataset, ISAR_800S);
    const easy = latestNamed(dataset, FLAUCHER_EASY);
    if (!reps || !easy) throw new Error('banner sessions missing');
    expect(midnight - reps.date).toBeLessThan(8 * 7 * DAY_MS);
    expect(midnight - easy.date).toBeLessThan(8 * 7 * DAY_MS);

    const repLaps = dataset.sessionData.find((d) => d.sessionId === reps.id)?.laps ?? [];
    expect(repLaps).toHaveLength(13);
    expect(repLaps[3]?.intensity).toBe('active');
    const zone3 = DEMO_PERSONA.restHr + (DEMO_PERSONA.maxHr - DEMO_PERSONA.restHr) * 0.7;
    expect(reps.maxHr ?? 0).toBeGreaterThanOrEqual(zone3);

    const easyLaps = dataset.sessionData.find((d) => d.sessionId === easy.id)?.laps ?? [];
    expect(easyLaps[0]?.distance).toBeCloseTo(1000, -1);
    expect(easy.gap).toBeDefined();

    const rides = dataset.sessions.filter(
      (s) => s.name === STARNBERGER_LONG_RIDE && midnight - s.date < 90 * DAY_MS,
    );
    expect(rides.length).toBeGreaterThanOrEqual(2);
    expect(rides.every((s) => (s.distance ?? 0) >= 50_000)).toBe(true);

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
        if (haversineM(HOME, { lat: r.lat, lng: r.lng }) > 1000) continue;
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
    expect(recordsOf(dataset, noStrap?.id ?? '').some((r) => r.hr !== undefined)).toBe(false);

    const indoor = dataset.sessions.find((s) => s.subSport === 'treadmill');
    expect(recordsOf(dataset, indoor?.id ?? '').some((r) => r.elevation !== undefined)).toBe(false);

    const cityRide = latestNamed(dataset, STARNBERGER_LONG_RIDE);
    const laps = dataset.sessionData.find((d) => d.sessionId === cityRide?.id)?.laps ?? [];
    expect(laps.some((l) => (l.totalMovingTime ?? 0) < l.totalTimerTime)).toBe(true);
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
});
