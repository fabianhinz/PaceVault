import { z } from 'zod';
import type { SessionRecord } from '@/packages/engine/types.ts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
  condition: WeatherCondition;
}

export interface SessionWeather {
  sessionId: string;
  snapshots: WeatherSnapshot[];
  fetchedAt: number;
}

// ---------------------------------------------------------------------------
// WMO weather code → condition mapping
// ---------------------------------------------------------------------------

export const wmoToCondition = (code: number): WeatherCondition => {
  if (code === 0) return 'clear';
  if (code >= 1 && code <= 2) return 'partly-cloudy';
  if (code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return 'snow';
  if (code === 95 || code === 96 || code === 99) return 'thunderstorm';
  return 'cloudy';
};

// ---------------------------------------------------------------------------
// Wind direction → compass label
// ---------------------------------------------------------------------------

const COMPASS_LABELS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;

export const formatWindDirection = (degrees: number): string => {
  const normalized = ((degrees % 360) + 360) % 360;
  const index = Math.round(normalized / 45) % 8;
  return COMPASS_LABELS[index] ?? 'N';
};

// ---------------------------------------------------------------------------
// GPS helpers
// ---------------------------------------------------------------------------
const EARTH_RADIUS_KM = 6371;

const haversineKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ---------------------------------------------------------------------------
// Hourly waypoint computation
// ---------------------------------------------------------------------------

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
  const gpsRecords = records.filter(
    (r) => r.lat !== undefined && r.lng !== undefined && r.timerTime !== undefined,
  );
  if (gpsRecords.length === 0) return [];

  const sessionEndMs = sessionDateMs + durationSec * 1000;

  // Generate hourly boundary timestamps covering the session
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

  // For short sessions (< 1h), ensure at least the start hour is included
  if (hours.length === 0) {
    hours.push(firstHour);
  }

  const waypoints: Waypoint[] = [];
  for (const hourTimestamp of hours) {
    const elapsedTarget = (hourTimestamp - sessionDateMs) / 1000;
    let closest = gpsRecords[0];
    let closestDiff = Math.abs((closest?.timerTime ?? 0) - elapsedTarget);

    for (const r of gpsRecords) {
      const diff = Math.abs((r.timerTime ?? 0) - elapsedTarget);
      if (diff < closestDiff) {
        closest = r;
        closestDiff = diff;
      }
    }

    if (closest?.lat !== undefined && closest?.lng !== undefined) {
      waypoints.push({
        time: hourTimestamp,
        lat: closest.lat,
        lng: closest.lng,
      });
    }
  }

  return waypoints;
};

// ---------------------------------------------------------------------------
// Waypoint deduplication
// ---------------------------------------------------------------------------

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
      if (haversineKm(wp.lat, wp.lng, cluster.lat, cluster.lng) < thresholdKm) {
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

// ---------------------------------------------------------------------------
// Open-Meteo API
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Zod schema for Open-Meteo response
// ---------------------------------------------------------------------------

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

export type OpenMeteoResponse = z.infer<typeof openMeteoResponseSchema>;

// ---------------------------------------------------------------------------
// Fetch + merge logic
// ---------------------------------------------------------------------------

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
        condition: wmoToCondition(weatherCode),
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
