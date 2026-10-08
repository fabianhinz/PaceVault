import { z } from 'zod';
import { haversineM } from '@/packages/engine/gps.ts';
import type { SessionRecord } from '@/packages/engine/types.ts';
import type { WindSample } from '@/packages/engine/windExposure.ts';

export type WeatherCondition =
  | 'clear'
  | 'partly-cloudy'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'snow'
  | 'thunderstorm';

export interface WeatherSnapshot {
  time: number;
  lat: number;
  lng: number;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windGusts: number;
  windDirection: number;
  weatherCode: number;
}

export interface SessionWeather {
  sessionId: string;
  snapshots: WeatherSnapshot[];
  fetchedAt: number;
}

export const wmoToCondition = (code: number): WeatherCondition => {
  if (code === 0) return 'clear';
  if (code >= 1 && code <= 2) return 'partly-cloudy';
  if (code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return 'snow';
  if (code >= 95 && code <= 99) return 'thunderstorm';
  return 'cloudy';
};

export type WeatherDescription =
  | WeatherCondition
  | 'drizzle-light'
  | 'drizzle-moderate'
  | 'drizzle-dense'
  | 'freezing-drizzle-light'
  | 'freezing-drizzle-dense'
  | 'rain-light'
  | 'rain-moderate'
  | 'rain-heavy'
  | 'freezing-rain-light'
  | 'freezing-rain-heavy'
  | 'snow-light'
  | 'snow-moderate'
  | 'snow-heavy'
  | 'snow-grains'
  | 'rain-showers-light'
  | 'rain-showers-moderate'
  | 'rain-showers-heavy'
  | 'snow-showers-light'
  | 'snow-showers-heavy'
  | 'thunderstorm-hail'
  | 'thunderstorm-heavy'
  | 'thunderstorm-hail-heavy';

const DESCRIPTION_BY_CODE: Partial<Record<number, WeatherDescription>> = {
  51: 'drizzle-light',
  53: 'drizzle-moderate',
  55: 'drizzle-dense',
  56: 'freezing-drizzle-light',
  57: 'freezing-drizzle-dense',
  61: 'rain-light',
  63: 'rain-moderate',
  65: 'rain-heavy',
  66: 'freezing-rain-light',
  67: 'freezing-rain-heavy',
  71: 'snow-light',
  73: 'snow-moderate',
  75: 'snow-heavy',
  77: 'snow-grains',
  80: 'rain-showers-light',
  81: 'rain-showers-moderate',
  82: 'rain-showers-heavy',
  85: 'snow-showers-light',
  86: 'snow-showers-heavy',
  95: 'thunderstorm',
  96: 'thunderstorm-hail',
  97: 'thunderstorm-heavy',
  99: 'thunderstorm-hail-heavy',
};

export const wmoToDescription = (code: number): WeatherDescription => {
  const description = DESCRIPTION_BY_CODE[code];
  if (description !== undefined) return description;
  return wmoToCondition(code);
};

export type PrecipitationIntensity = 'none' | 'light' | 'moderate' | 'heavy';

const INTENSITY_BY_CODE: Partial<Record<number, PrecipitationIntensity>> = {
  51: 'light',
  56: 'light',
  61: 'light',
  66: 'light',
  71: 'light',
  77: 'light',
  80: 'light',
  85: 'light',
  53: 'moderate',
  63: 'moderate',
  73: 'moderate',
  81: 'moderate',
  95: 'moderate',
  96: 'moderate',
  55: 'heavy',
  57: 'heavy',
  65: 'heavy',
  67: 'heavy',
  75: 'heavy',
  82: 'heavy',
  86: 'heavy',
  97: 'heavy',
  99: 'heavy',
};

const DRY_CONDITIONS: ReadonlySet<WeatherCondition> = new Set([
  'clear',
  'partly-cloudy',
  'cloudy',
  'fog',
]);

export const wmoToPrecipitation = (code: number): PrecipitationIntensity | undefined => {
  const intensity = INTENSITY_BY_CODE[code];
  if (intensity !== undefined) return intensity;
  if (DRY_CONDITIONS.has(wmoToCondition(code))) return 'none';
  return undefined;
};

export type PrecipitationType = 'rain' | 'freezing' | 'snow' | 'thunderstorm';

export type PrecipitationDots = 0 | 1 | 2 | 3;

export interface PrecipitationMark {
  dots: PrecipitationDots | undefined;
  type: PrecipitationType | undefined;
}

const DOTS_BY_INTENSITY: Record<PrecipitationIntensity, PrecipitationDots> = {
  none: 0,
  light: 1,
  moderate: 2,
  heavy: 3,
};

const FREEZING_CODES: ReadonlySet<number> = new Set([56, 57, 66, 67]);

const precipitationType = (code: number): PrecipitationType | undefined => {
  if (FREEZING_CODES.has(code)) return 'freezing';
  const condition = wmoToCondition(code);
  if (condition === 'drizzle' || condition === 'rain') return 'rain';
  if (condition === 'snow') return 'snow';
  if (condition === 'thunderstorm') return 'thunderstorm';
  return undefined;
};

export const wmoToPrecipitationMark = (code: number): PrecipitationMark => {
  const intensity = wmoToPrecipitation(code);
  let dots: PrecipitationDots | undefined = undefined;
  if (intensity !== undefined) dots = DOTS_BY_INTENSITY[intensity];
  return { dots, type: precipitationType(code) };
};

interface Waypoint {
  time: number;
  lat: number;
  lng: number;
}

export const computeHourlyWaypoints = (
  sessionDateMs: number,
  durationSec: number,
  records: SessionRecord[],
): Waypoint[] => {
  const gpsRecords = records.filter((r) => r.lat !== undefined && r.lng !== undefined);
  if (gpsRecords.length === 0) return [];

  const sessionEndMs = sessionDateMs + durationSec * 1000;

  const hourMs = 3600 * 1000;
  const firstHour = Math.floor(sessionDateMs / hourMs) * hourMs;
  const hours: number[] = [];
  let h = firstHour;
  while (h <= sessionEndMs) {
    if (h >= sessionDateMs - hourMs) {
      hours.push(h);
    }
    h += hourMs;
  }

  if (hours.length === 0) {
    hours.push(firstHour);
  }

  const waypoints: Waypoint[] = [];
  for (const hourTimestamp of hours) {
    const elapsedTarget = (hourTimestamp - sessionDateMs) / 1000;
    let closest = gpsRecords[0];
    if (closest === undefined) continue;
    let closestDiff = Math.abs(closest.timestamp - elapsedTarget);

    for (const r of gpsRecords) {
      const diff = Math.abs(r.timestamp - elapsedTarget);
      if (diff < closestDiff) {
        closest = r;
        closestDiff = diff;
      }
    }

    if (closest.lat !== undefined && closest.lng !== undefined) {
      waypoints.push({
        time: hourTimestamp,
        lat: closest.lat,
        lng: closest.lng,
      });
    }
  }

  return waypoints;
};

interface WaypointCluster {
  lat: number;
  lng: number;
  waypointIndices: number[];
}

export const deduplicateWaypoints = (
  waypoints: Waypoint[],
  thresholdKm: number,
): WaypointCluster[] => {
  const clusters: WaypointCluster[] = [];

  for (let i = 0; i < waypoints.length; i++) {
    const wp = waypoints[i];
    if (!wp) continue;

    let merged = false;
    for (const cluster of clusters) {
      if (haversineM(wp, cluster) < thresholdKm * 1000) {
        cluster.waypointIndices.push(i);
        merged = true;
        break;
      }
    }

    if (!merged) {
      clusters.push({ lat: wp.lat, lng: wp.lng, waypointIndices: [i] });
    }
  }

  return clusters;
};

// The API is queried with timezone=UTC, so date params must be UTC days —
// browser-local dates would shift the requested window near midnight.
const toUtcDateStr = (ms: number): string => {
  const d = new Date(ms);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const buildWeatherUrl = (
  lat: number,
  lng: number,
  startDate: string,
  endDate: string,
): string => {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    start_date: startDate,
    end_date: endDate,
    hourly:
      'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,wind_direction_10m,weather_code',
    timezone: 'UTC',
    timeformat: 'unixtime',
  });
  return `https://archive-api.open-meteo.com/v1/archive?${params.toString()}`;
};

const openMeteoHourlySchema = z.object({
  // unix epoch seconds (timeformat=unixtime)
  time: z.array(z.number()),
  temperature_2m: z.array(z.number().nullable()),
  apparent_temperature: z.array(z.number().nullable()),
  relative_humidity_2m: z.array(z.number().nullable()),
  wind_speed_10m: z.array(z.number().nullable()),
  wind_gusts_10m: z.array(z.number().nullable()),
  wind_direction_10m: z.array(z.number().nullable()),
  weather_code: z.array(z.number().nullable()),
});

const openMeteoResponseSchema = z.object({
  hourly: openMeteoHourlySchema,
});

type OpenMeteoResponse = z.infer<typeof openMeteoResponseSchema>;

const fetchClusterWeather = async (
  lat: number,
  lng: number,
  startDate: string,
  endDate: string,
): Promise<OpenMeteoResponse | undefined> => {
  const url = buildWeatherUrl(lat, lng, startDate, endDate);
  const response = await fetch(url);
  if (!response.ok) return undefined;
  const json: unknown = await response.json();
  const result = openMeteoResponseSchema.safeParse(json);
  if (!result.success) return undefined;
  return result.data;
};

const pickHourIndex = (targetMs: number, timesEpochSec: number[]): number => {
  let bestIdx = 0;
  let bestDiff = Number.POSITIVE_INFINITY;

  for (let i = 0; i < timesEpochSec.length; i++) {
    const timeSec = timesEpochSec[i];
    if (timeSec === undefined) continue;
    const diff = Math.abs(timeSec * 1000 - targetMs);
    if (diff < bestDiff) {
      bestIdx = i;
      bestDiff = diff;
    }
  }

  return bestIdx;
};

export const fetchSessionWeather = async (
  sessionId: string,
  sessionDateMs: number,
  durationSec: number,
  records: SessionRecord[],
): Promise<SessionWeather | undefined> => {
  const waypoints = computeHourlyWaypoints(sessionDateMs, durationSec, records);
  if (waypoints.length === 0) return undefined;

  const clusters = deduplicateWaypoints(waypoints, 10);
  if (clusters.length === 0) return undefined;

  const sessionEndMs = sessionDateMs + durationSec * 1000;
  const startDate = toUtcDateStr(sessionDateMs);
  const endDate = toUtcDateStr(sessionEndMs);

  const clusterResults = await Promise.all(
    clusters.map((c) => fetchClusterWeather(c.lat, c.lng, startDate, endDate)),
  );

  const snapshots: WeatherSnapshot[] = [];

  for (let ci = 0; ci < clusters.length; ci++) {
    const cluster = clusters[ci];
    const data = clusterResults[ci];
    if (!cluster || !data) continue;

    for (const wpIdx of cluster.waypointIndices) {
      const wp = waypoints[wpIdx];
      if (!wp) continue;

      const hourIdx = pickHourIndex(wp.time, data.hourly.time);
      const temperature = data.hourly.temperature_2m[hourIdx];
      const feelsLike = data.hourly.apparent_temperature[hourIdx];
      const humidity = data.hourly.relative_humidity_2m[hourIdx];
      const windSpeed = data.hourly.wind_speed_10m[hourIdx];
      const windGusts = data.hourly.wind_gusts_10m[hourIdx];
      const windDirection = data.hourly.wind_direction_10m[hourIdx];
      const weatherCode = data.hourly.weather_code[hourIdx];

      if (
        temperature === null ||
        temperature === undefined ||
        feelsLike === null ||
        feelsLike === undefined ||
        humidity === null ||
        humidity === undefined ||
        windSpeed === null ||
        windSpeed === undefined ||
        windGusts === null ||
        windGusts === undefined ||
        windDirection === null ||
        windDirection === undefined ||
        weatherCode === null ||
        weatherCode === undefined
      ) {
        continue;
      }

      snapshots.push({
        time: wp.time,
        lat: wp.lat,
        lng: wp.lng,
        temperature,
        feelsLike,
        humidity,
        windSpeed,
        windGusts,
        windDirection,
        weatherCode,
      });
    }
  }

  if (snapshots.length === 0) return undefined;

  snapshots.sort((a, b) => a.time - b.time);

  return {
    sessionId,
    snapshots,
    fetchedAt: Date.now(),
  };
};

export const toWindSamples = (weather: SessionWeather): WindSample[] =>
  weather.snapshots.map((s) => ({ time: s.time, direction: s.windDirection }));
