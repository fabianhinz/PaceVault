import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  wmoToCondition,
  formatWindDirection,
  computeHourlyWaypoints,
  deduplicateWaypoints,
  buildWeatherUrl,
  fetchSessionWeather,
} from '@/lib/weather.ts';
import type { SessionRecord } from '@/packages/engine/types.ts';

// ---------------------------------------------------------------------------
// wmoToCondition
// ---------------------------------------------------------------------------

describe('wmoToCondition', () => {
  it('maps code 0 to clear', () => {
    expect(wmoToCondition(0)).toBe('clear');
  });

  it('maps codes 1-2 to partly-cloudy', () => {
    expect(wmoToCondition(1)).toBe('partly-cloudy');
    expect(wmoToCondition(2)).toBe('partly-cloudy');
  });

  it('maps code 3 to cloudy', () => {
    expect(wmoToCondition(3)).toBe('cloudy');
  });

  it('maps fog codes 45, 48', () => {
    expect(wmoToCondition(45)).toBe('fog');
    expect(wmoToCondition(48)).toBe('fog');
  });

  it('maps drizzle codes 51-57', () => {
    expect(wmoToCondition(51)).toBe('drizzle');
    expect(wmoToCondition(55)).toBe('drizzle');
    expect(wmoToCondition(57)).toBe('drizzle');
  });

  it('maps rain codes 61-67 and 80-82', () => {
    expect(wmoToCondition(61)).toBe('rain');
    expect(wmoToCondition(67)).toBe('rain');
    expect(wmoToCondition(80)).toBe('rain');
    expect(wmoToCondition(82)).toBe('rain');
  });

  it('maps snow codes 71-77 and 85-86', () => {
    expect(wmoToCondition(71)).toBe('snow');
    expect(wmoToCondition(77)).toBe('snow');
    expect(wmoToCondition(85)).toBe('snow');
    expect(wmoToCondition(86)).toBe('snow');
  });

  it('maps thunderstorm codes 95, 96, 99', () => {
    expect(wmoToCondition(95)).toBe('thunderstorm');
    expect(wmoToCondition(96)).toBe('thunderstorm');
    expect(wmoToCondition(99)).toBe('thunderstorm');
  });

  it('falls back to cloudy for unknown codes', () => {
    expect(wmoToCondition(100)).toBe('cloudy');
    expect(wmoToCondition(-1)).toBe('cloudy');
  });
});

// ---------------------------------------------------------------------------
// formatWindDirection
// ---------------------------------------------------------------------------

describe('formatWindDirection', () => {
  it('maps 0 degrees to N', () => {
    expect(formatWindDirection(0)).toBe('N');
  });

  it('maps 90 degrees to E', () => {
    expect(formatWindDirection(90)).toBe('E');
  });

  it('maps 180 degrees to S', () => {
    expect(formatWindDirection(180)).toBe('S');
  });

  it('maps 270 degrees to W', () => {
    expect(formatWindDirection(270)).toBe('W');
  });

  it('maps 45 degrees to NE', () => {
    expect(formatWindDirection(45)).toBe('NE');
  });

  it('maps 225 degrees to SW', () => {
    expect(formatWindDirection(225)).toBe('SW');
  });

  it('maps 360 degrees to N', () => {
    expect(formatWindDirection(360)).toBe('N');
  });

  it('handles negative degrees', () => {
    expect(formatWindDirection(-90)).toBe('W');
  });
});

// ---------------------------------------------------------------------------
// computeHourlyWaypoints
// ---------------------------------------------------------------------------

const makeRecord = (timerTime: number, lat: number, lng: number): SessionRecord => ({
  sessionId: 'test',
  timestamp: timerTime,
  timerTime,
  lat,
  lng,
});

describe('computeHourlyWaypoints', () => {
  it('returns empty array for records without GPS', () => {
    const records: SessionRecord[] = [{ sessionId: 'test', timestamp: 0, timerTime: 0, hr: 140 }];
    const result = computeHourlyWaypoints(Date.now(), 3600, records);
    expect(result).toEqual([]);
  });

  it('returns a single waypoint for a short session', () => {
    const sessionDate = new Date('2026-04-08T10:30:00Z').getTime();
    const records = [makeRecord(0, 48.1, 11.5), makeRecord(1800, 48.11, 11.51)];
    const result = computeHourlyWaypoints(sessionDate, 1800, records);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0]?.lat).toBeDefined();
    expect(result[0]?.lng).toBeDefined();
  });

  it('returns multiple waypoints for a multi-hour session', () => {
    const sessionDate = new Date('2026-04-08T09:00:00Z').getTime();
    const records = [
      makeRecord(0, 48.1, 11.5),
      makeRecord(3600, 48.2, 11.6),
      makeRecord(7200, 48.3, 11.7),
    ];
    const result = computeHourlyWaypoints(sessionDate, 7200, records);
    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  it('picks the closest GPS record for each hour boundary', () => {
    const sessionDate = new Date('2026-04-08T10:00:00Z').getTime();
    const records = [
      makeRecord(0, 48.1, 11.5),
      makeRecord(1800, 48.15, 11.55),
      makeRecord(3600, 48.2, 11.6),
    ];
    const result = computeHourlyWaypoints(sessionDate, 3600, records);
    // First waypoint at hour boundary 10:00 should be closest to timerTime 0
    expect(result[0]?.lat).toBe(48.1);
  });

  it('handles sessions crossing midnight', () => {
    const sessionDate = new Date('2026-04-08T23:00:00Z').getTime();
    const records = [
      makeRecord(0, 48.1, 11.5),
      makeRecord(3600, 48.2, 11.6),
      makeRecord(7200, 48.3, 11.7),
    ];
    const result = computeHourlyWaypoints(sessionDate, 7200, records);
    expect(result.length).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// deduplicateWaypoints
// ---------------------------------------------------------------------------

describe('deduplicateWaypoints', () => {
  it('clusters nearby waypoints together', () => {
    const waypoints = [
      { time: 0, lat: 48.1, lng: 11.5 },
      { time: 3600000, lat: 48.1001, lng: 11.5001 }, // ~15m away
    ];
    const clusters = deduplicateWaypoints(waypoints, 10);
    expect(clusters).toHaveLength(1);
    expect(clusters[0]?.waypointIndices).toEqual([0, 1]);
  });

  it('keeps distant waypoints in separate clusters', () => {
    const waypoints = [
      { time: 0, lat: 48.1, lng: 11.5 },
      { time: 3600000, lat: 49.0, lng: 12.5 }, // ~120km away
    ];
    const clusters = deduplicateWaypoints(waypoints, 10);
    expect(clusters).toHaveLength(2);
  });

  it('returns empty array for empty input', () => {
    expect(deduplicateWaypoints([], 10)).toEqual([]);
  });

  it('handles single waypoint', () => {
    const waypoints = [{ time: 0, lat: 48.1, lng: 11.5 }];
    const clusters = deduplicateWaypoints(waypoints, 10);
    expect(clusters).toHaveLength(1);
    expect(clusters[0]?.waypointIndices).toEqual([0]);
  });
});

// ---------------------------------------------------------------------------
// buildWeatherUrl
// ---------------------------------------------------------------------------

describe('buildWeatherUrl', () => {
  it('constructs a valid URL with all parameters', () => {
    const url = buildWeatherUrl(48.1, 11.5, '2026-04-08', '2026-04-08');
    expect(url).toContain('archive-api.open-meteo.com');
    expect(url).toContain('latitude=48.1');
    expect(url).toContain('longitude=11.5');
    expect(url).toContain('start_date=2026-04-08');
    expect(url).toContain('end_date=2026-04-08');
    expect(url).toContain('temperature_2m');
    expect(url).toContain('timezone=UTC');
    expect(url).toContain('timeformat=unixtime');
  });

  it('supports different start and end dates for multi-day sessions', () => {
    const url = buildWeatherUrl(48.1, 11.5, '2026-04-08', '2026-04-09');
    expect(url).toContain('start_date=2026-04-08');
    expect(url).toContain('end_date=2026-04-09');
  });
});

// ---------------------------------------------------------------------------
// fetchSessionWeather — hour matching must be timezone-independent
// ---------------------------------------------------------------------------

// Hourly payload as the API returns it with timeformat=unixtime: epoch-second
// timestamps starting at 2026-04-08T00:00Z. temperature_2m encodes the hour
// index so assertions can pinpoint exactly which hours were matched.
const DAY_START_SEC = Date.UTC(2026, 3, 8) / 1000;

const makeHourly = (days: number) => {
  const time = Array.from({ length: 24 * days }, (_, i) => DAY_START_SEC + i * 3600);
  return {
    time,
    temperature_2m: time.map((_, i) => i),
    apparent_temperature: time.map(() => 1),
    relative_humidity_2m: time.map(() => 50),
    wind_speed_10m: time.map(() => 10),
    wind_gusts_10m: time.map(() => 20),
    wind_direction_10m: time.map(() => 180),
    weather_code: time.map(() => 0),
  };
};

const stubFetch = (body: unknown, ok = true) => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    json: async () => body,
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

describe('fetchSessionWeather', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('matches snapshots to hours via epoch timestamps, independent of the browser timezone', async () => {
    const fetchMock = stubFetch({ hourly: makeHourly(1) });
    // 10:30–11:00 UTC → hour boundaries 10:00 and 11:00 UTC
    const sessionDate = Date.UTC(2026, 3, 8, 10, 30);
    const records = [makeRecord(0, 48.1, 11.5), makeRecord(1800, 48.1001, 11.5001)];

    const result = await fetchSessionWeather('s1', sessionDate, 1800, records);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result?.snapshots.map((s) => s.temperature)).toEqual([10, 11]);
    expect(result?.snapshots.map((s) => s.time)).toEqual([
      Date.UTC(2026, 3, 8, 10),
      Date.UTC(2026, 3, 8, 11),
    ]);
  });

  it('requests UTC days and matches hours across a UTC midnight crossing', async () => {
    const fetchMock = stubFetch({ hourly: makeHourly(2) });
    // 23:30–00:30 UTC → hour boundaries 23:00 (idx 23) and 00:00 next day (idx 24)
    const sessionDate = Date.UTC(2026, 3, 8, 23, 30);
    const records = [makeRecord(0, 48.1, 11.5), makeRecord(3600, 48.1001, 11.5001)];

    const result = await fetchSessionWeather('s1', sessionDate, 3600, records);

    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain('start_date=2026-04-08');
    expect(url).toContain('end_date=2026-04-09');
    expect(result?.snapshots.map((s) => s.temperature)).toEqual([23, 24]);
  });

  it('returns undefined when the response has ISO string times instead of unixtime', async () => {
    stubFetch({ hourly: { ...makeHourly(1), time: ['2026-04-08T10:00'] } });
    const sessionDate = Date.UTC(2026, 3, 8, 10, 30);
    const records = [makeRecord(0, 48.1, 11.5)];

    const result = await fetchSessionWeather('s1', sessionDate, 1800, records);

    expect(result).toBeUndefined();
  });

  it('returns undefined when the API responds with an error status', async () => {
    stubFetch({}, false);
    const sessionDate = Date.UTC(2026, 3, 8, 10, 30);
    const records = [makeRecord(0, 48.1, 11.5)];

    const result = await fetchSessionWeather('s1', sessionDate, 1800, records);

    expect(result).toBeUndefined();
  });
});
