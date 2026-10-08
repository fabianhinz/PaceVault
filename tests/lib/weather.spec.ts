import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  wmoToCondition,
  wmoToDescription,
  wmoToPrecipitation,
  wmoToPrecipitationMark,
  computeHourlyWaypoints,
  deduplicateWaypoints,
  buildWeatherUrl,
  fetchSessionWeather,
} from '@/lib/weather.ts';
import type { SessionRecord } from '@/packages/engine/types.ts';

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

  it('maps thunderstorm codes 95, 96, 97, 99', () => {
    expect(wmoToCondition(95)).toBe('thunderstorm');
    expect(wmoToCondition(97)).toBe('thunderstorm');
    expect(wmoToCondition(96)).toBe('thunderstorm');
    expect(wmoToCondition(99)).toBe('thunderstorm');
  });

  it('falls back to cloudy for unknown codes', () => {
    expect(wmoToCondition(100)).toBe('cloudy');
    expect(wmoToCondition(-1)).toBe('cloudy');
  });
});

describe('wmoToDescription', () => {
  it.each([
    [0, 'clear'],
    [2, 'partly-cloudy'],
    [3, 'cloudy'],
    [48, 'fog'],
    [51, 'drizzle-light'],
    [53, 'drizzle-moderate'],
    [55, 'drizzle-dense'],
    [56, 'freezing-drizzle-light'],
    [57, 'freezing-drizzle-dense'],
    [61, 'rain-light'],
    [63, 'rain-moderate'],
    [65, 'rain-heavy'],
    [66, 'freezing-rain-light'],
    [67, 'freezing-rain-heavy'],
    [71, 'snow-light'],
    [73, 'snow-moderate'],
    [75, 'snow-heavy'],
    [77, 'snow-grains'],
    [80, 'rain-showers-light'],
    [81, 'rain-showers-moderate'],
    [82, 'rain-showers-heavy'],
    [85, 'snow-showers-light'],
    [86, 'snow-showers-heavy'],
    [95, 'thunderstorm'],
    [96, 'thunderstorm-hail'],
    [97, 'thunderstorm-heavy'],
    [99, 'thunderstorm-hail-heavy'],
  ])('maps code %i to %s', (code, description) => {
    expect(wmoToDescription(code)).toBe(description);
  });

  it('falls back to the coarse condition for codes without an intensity', () => {
    expect(wmoToDescription(52)).toBe('drizzle');
    expect(wmoToDescription(62)).toBe('rain');
    expect(wmoToDescription(76)).toBe('snow');
    expect(wmoToDescription(98)).toBe('thunderstorm');
    expect(wmoToDescription(100)).toBe('cloudy');
    expect(wmoToDescription(-1)).toBe('cloudy');
  });
});

describe('wmoToPrecipitation', () => {
  it.each([0, 1, 2, 3, 45, 48])('reports no precipitation for dry code %i', (code) => {
    expect(wmoToPrecipitation(code)).toBe('none');
  });

  it.each([51, 56, 61, 66, 71, 77, 80, 85])('classifies code %i as light', (code) => {
    expect(wmoToPrecipitation(code)).toBe('light');
  });

  it.each([53, 63, 73, 81, 95, 96])('classifies code %i as moderate', (code) => {
    expect(wmoToPrecipitation(code)).toBe('moderate');
  });

  it.each([55, 57, 65, 67, 75, 82, 86, 97, 99])('classifies code %i as heavy', (code) => {
    expect(wmoToPrecipitation(code)).toBe('heavy');
  });

  it('reports no precipitation for unknown codes that fall back to a dry sky', () => {
    expect(wmoToPrecipitation(4)).toBe('none');
    expect(wmoToPrecipitation(100)).toBe('none');
    expect(wmoToPrecipitation(-1)).toBe('none');
  });

  it('leaves the intensity unknown for unknown codes that fall back to precipitation', () => {
    expect(wmoToPrecipitation(52)).toBeUndefined();
    expect(wmoToPrecipitation(62)).toBeUndefined();
    expect(wmoToPrecipitation(76)).toBeUndefined();
    expect(wmoToPrecipitation(98)).toBeUndefined();
  });
});

describe('wmoToPrecipitationMark', () => {
  it.each([0, 1, 2, 3, 45, 48, 100])('shows no dots for dry code %i', (code) => {
    expect(wmoToPrecipitationMark(code)).toEqual({ dots: 0, type: undefined });
  });

  it.each([
    [51, 1],
    [53, 2],
    [55, 3],
    [61, 1],
    [63, 2],
    [65, 3],
    [80, 1],
    [81, 2],
    [82, 3],
  ])('marks drizzle, rain and showers code %i as rain with %i dots', (code, dots) => {
    expect(wmoToPrecipitationMark(code)).toEqual({ dots, type: 'rain' });
  });

  it.each([
    [56, 1],
    [57, 3],
    [66, 1],
    [67, 3],
  ])('marks freezing code %i apart from rain with %i dots', (code, dots) => {
    expect(wmoToPrecipitationMark(code)).toEqual({ dots, type: 'freezing' });
  });

  it.each([
    [71, 1],
    [73, 2],
    [75, 3],
    [77, 1],
    [85, 1],
    [86, 3],
  ])('marks snow code %i as snow with %i dots', (code, dots) => {
    expect(wmoToPrecipitationMark(code)).toEqual({ dots, type: 'snow' });
  });

  it.each([
    [95, 2],
    [96, 2],
    [97, 3],
    [99, 3],
  ])('marks thunderstorm and hail code %i with %i dots', (code, dots) => {
    expect(wmoToPrecipitationMark(code)).toEqual({ dots, type: 'thunderstorm' });
  });

  it('keeps the type but no dot count when the intensity is unknown', () => {
    expect(wmoToPrecipitationMark(62)).toEqual({ dots: undefined, type: 'rain' });
    expect(wmoToPrecipitationMark(76)).toEqual({ dots: undefined, type: 'snow' });
    expect(wmoToPrecipitationMark(98)).toEqual({ dots: undefined, type: 'thunderstorm' });
  });
});

const makeRecord = (timerTime: number, lat: number, lng: number): SessionRecord => ({
  timestamp: timerTime,
  timerTime,
  lat,
  lng,
});

describe('computeHourlyWaypoints', () => {
  it('returns empty array for records without GPS', () => {
    const records: SessionRecord[] = [{ timestamp: 0, timerTime: 0, hr: 140 }];
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
    expect(result[0]?.lat).toBe(48.1);
  });

  it('weather waypoint lands an hour off after a paused stretch', () => {
    const sessionDate = new Date('2026-04-08T10:00:00Z').getTime();
    const records: SessionRecord[] = [
      { timestamp: 0, timerTime: 0, lat: 48.1, lng: 11.5 },
      { timestamp: 1800, timerTime: 1800, lat: 48.15, lng: 11.55 },
      { timestamp: 5400, timerTime: 1801, lat: 48.2, lng: 11.6 },
      { timestamp: 7200, timerTime: 3600, lat: 48.3, lng: 11.7 },
    ];
    const result = computeHourlyWaypoints(sessionDate, 7200, records);
    expect(result.map((w) => w.lat)).toEqual([48.1, 48.15, 48.3]);
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

describe('deduplicateWaypoints', () => {
  it('clusters nearby waypoints together', () => {
    const waypoints = [
      { time: 0, lat: 48.1, lng: 11.5 },
      { time: 3600000, lat: 48.1001, lng: 11.5001 },
    ];
    const clusters = deduplicateWaypoints(waypoints, 10);
    expect(clusters).toHaveLength(1);
    expect(clusters[0]?.waypointIndices).toEqual([0, 1]);
  });

  it('keeps distant waypoints in separate clusters', () => {
    const waypoints = [
      { time: 0, lat: 48.1, lng: 11.5 },
      { time: 3600000, lat: 49.0, lng: 12.5 },
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
