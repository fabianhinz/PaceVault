/**
 * Standalone Node script that builds the bundled demo routes.
 * Run with: pnpm generate-demo-routes
 * Output: src/features/demo/demoRoutes.json
 *
 * Network is used only here, at generation time: OSRM (FOSSGIS instance with real
 * foot and bike profiles) for the geometry, Open-Meteo's elevation API for the DEM.
 * The app never calls either for the demo.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import polylineCodec from '@googlemaps/polyline-codec';

const decode = polylineCodec.decode;
const encode = polylineCodec.encode;

const scriptDir = dirname(fileURLToPath(import.meta.url));

const OSRM_BASE: Record<Profile, string> = {
  foot: 'https://routing.openstreetmap.de/routed-foot/route/v1/driving',
  bike: 'https://routing.openstreetmap.de/routed-bike/route/v1/driving',
};
const ELEVATION_URL = 'https://api.open-meteo.com/v1/elevation';
const ELEVATION_BATCH = 100;
const SPACING_M: Record<Profile, number> = { foot: 25, bike: 50 };
// Open-Meteo allows ~600 locations per minute and 10k per day, and its DEM is ~90 m,
// so elevation is sampled every 4th point and interpolated in between.
const ELEVATION_STRIDE = 4;
const ELEVATION_PAUSE_MS = 11_000;
const SMOOTH_RADIUS = 2;
const DRY_RUN = process.argv.includes('--dry');

type Profile = 'foot' | 'bike';
type Group = 'routes' | 'trip' | 'studio';
type LngLat = [number, number];

type RouteConfig = {
  key: string;
  name: string;
  group: Group;
  profile: Profile;
  waypoints: LngLat[];
};

// Glockenbach, Munich
const HOME: LngLat = [11.565, 48.125];
// Wittelsbacherbrücke on the Isar, shared by the Flaucher run and the Isar bike path
const ISAR_BRIDGE: LngLat = [11.5725, 48.1225];
const FLAUCHER: LngLat = [11.5575, 48.1075];
// Riva del Garda, lakefront
const RIVA: LngLat = [10.8405, 45.8845];

const ROUTE_CONFIGS: RouteConfig[] = [
  // --- Running loops from HOME ---
  {
    key: 'flaucher',
    name: 'Flaucher',
    group: 'routes',
    profile: 'foot',
    waypoints: [HOME, ISAR_BRIDGE, FLAUCHER, [11.5615, 48.1085], [11.5745, 48.1195], HOME],
  },
  {
    key: 'isar-south',
    name: 'Isar south',
    group: 'routes',
    profile: 'foot',
    waypoints: [HOME, ISAR_BRIDGE, FLAUCHER, [11.548, 48.0985], [11.5555, 48.099], HOME],
  },
  {
    key: 'isar-north',
    name: 'Isar north',
    group: 'routes',
    profile: 'foot',
    waypoints: [HOME, ISAR_BRIDGE, [11.5835, 48.1305], [11.5895, 48.1365], [11.578, 48.1335], HOME],
  },
  {
    key: 'englischer-garten',
    name: 'Englischer Garten',
    group: 'routes',
    profile: 'foot',
    waypoints: [
      HOME,
      ISAR_BRIDGE,
      [11.5895, 48.1365],
      [11.5905, 48.1525],
      [11.5925, 48.1615],
      [11.5835, 48.1505],
      HOME,
    ],
  },
  {
    key: 'westpark',
    name: 'Westpark',
    group: 'routes',
    profile: 'foot',
    waypoints: [HOME, [11.5455, 48.1205], [11.5205, 48.1225], [11.5305, 48.1185], HOME],
  },
  {
    key: 'theresienwiese',
    name: 'Theresienwiese',
    group: 'routes',
    profile: 'foot',
    waypoints: [HOME, [11.5495, 48.1315], [11.5455, 48.1355], [11.5555, 48.1365], HOME],
  },
  {
    key: 'olympiapark',
    name: 'Olympiapark',
    group: 'routes',
    profile: 'foot',
    waypoints: [
      HOME,
      [11.5555, 48.1505],
      [11.5505, 48.1735],
      [11.5585, 48.1745],
      [11.5655, 48.1505],
      HOME,
    ],
  },
  {
    key: 'isar-long',
    name: 'Isar long run',
    group: 'routes',
    profile: 'foot',
    waypoints: [
      HOME,
      ISAR_BRIDGE,
      FLAUCHER,
      [11.5185, 48.0555],
      [11.5335, 48.0645],
      [11.5555, 48.099],
      HOME,
    ],
  },

  // --- Cycling loops from HOME ---
  {
    key: 'north-garching',
    name: 'North loop Garching',
    group: 'routes',
    profile: 'bike',
    waypoints: [HOME, [11.575, 48.165], [11.65, 48.25], [11.68, 48.22], [11.63, 48.155], HOME],
  },
  {
    key: 'south-gruenwald',
    name: 'South loop Grünwald',
    group: 'routes',
    profile: 'bike',
    waypoints: [HOME, [11.575, 48.1], [11.53, 48.05], [11.49, 48.06], [11.51, 48.1], HOME],
  },
  {
    key: 'west-dachau',
    name: 'West loop Dachau',
    group: 'routes',
    profile: 'bike',
    waypoints: [HOME, [11.505, 48.158], [11.435, 48.26], [11.53, 48.25], [11.575, 48.17], HOME],
  },
  {
    key: 'east-markt-schwaben',
    name: 'East loop Markt Schwaben',
    group: 'routes',
    profile: 'bike',
    waypoints: [
      HOME,
      [11.63, 48.135],
      [11.72, 48.14],
      [11.75, 48.11],
      [11.68, 48.095],
      [11.6, 48.11],
      HOME,
    ],
  },
  {
    key: 'starnberger-see',
    name: 'Starnberger See',
    group: 'routes',
    profile: 'bike',
    waypoints: [
      HOME,
      [11.53, 48.08],
      [11.35, 47.91],
      [11.3, 47.95],
      [11.4, 48.04],
      [11.5, 48.1],
      HOME,
    ],
  },
  {
    key: 'isar-wolfratshausen',
    name: 'Isar to Wolfratshausen',
    group: 'routes',
    profile: 'bike',
    waypoints: [
      HOME,
      ISAR_BRIDGE,
      FLAUCHER,
      [11.528, 48.0715],
      [11.426, 47.913],
      [11.49, 48.0],
      HOME,
    ],
  },

  // --- Lake Garda trip, from Riva ---
  {
    key: 'garda-tenno',
    name: 'Lago di Tenno',
    group: 'trip',
    profile: 'bike',
    waypoints: [RIVA, [10.8325, 45.9185], [10.8285, 45.9345], [10.8125, 45.9035], RIVA],
  },
  {
    key: 'garda-loppio',
    name: 'Passo San Giovanni',
    group: 'trip',
    profile: 'bike',
    waypoints: [
      RIVA,
      [10.8755, 45.8715],
      [10.8885, 45.8765],
      [10.9255, 45.8585],
      [10.9805, 45.8515],
      RIVA,
    ],
  },
  {
    key: 'garda-arco',
    name: 'Arco and Dro',
    group: 'trip',
    profile: 'bike',
    waypoints: [
      RIVA,
      [10.8865, 45.9185],
      [10.9115, 45.9625],
      [10.8995, 45.9285],
      [10.8755, 45.8715],
      RIVA,
    ],
  },
  {
    key: 'garda-torbole',
    name: 'Riva to Torbole',
    group: 'trip',
    profile: 'foot',
    waypoints: [RIVA, [10.8555, 45.8805], [10.8745, 45.8705], [10.8555, 45.8805], RIVA],
  },

  // --- Studio route, never ridden ---
  {
    key: 'tegernsee',
    name: 'Tegernsee loop',
    group: 'studio',
    profile: 'bike',
    waypoints: [
      HOME,
      [11.7, 47.885],
      [11.738, 47.75],
      [11.758, 47.69],
      [11.72, 47.715],
      [11.62, 47.85],
      HOME,
    ],
  },
];

type OutputRoute = {
  key: string;
  name: string;
  sport: 'running' | 'cycling';
  polyline: string;
  elevations: number[];
};

const toRad = (deg: number): number => (deg * Math.PI) / 180;

const haversineM = (a: [number, number], b: [number, number]): number => {
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const fetchJson = async (url: string): Promise<unknown> => {
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(url);
    if (res.ok) return res.json();
    console.warn(`  HTTP ${res.status}, retrying…`);
    if (res.status === 429) {
      await sleep(61_000);
    } else {
      await sleep(2000 * (attempt + 1));
    }
  }
  throw new Error(`Request failed: ${url}`);
};

const fetchGeometry = async (config: RouteConfig): Promise<Array<[number, number]>> => {
  const coords = config.waypoints.map(([lng, lat]) => `${lng},${lat}`).join(';');
  const url = `${OSRM_BASE[config.profile]}/${coords}?overview=full&geometries=polyline`;
  const data = (await fetchJson(url)) as { routes?: Array<{ geometry: string }> };
  const route = data.routes?.[0];
  if (!route) throw new Error(`No route for ${config.key}`);
  return decode(route.geometry, 5);
};

// Points every `spacing` metres along the line, plus the exact last point.
const resample = (line: Array<[number, number]>, spacing: number): Array<[number, number]> => {
  const first = line[0];
  if (!first) return [];
  const out: Array<[number, number]> = [first];
  let carried = 0;
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1];
    const b = line[i];
    if (!a || !b) continue;
    const segment = haversineM(a, b);
    if (segment === 0) continue;
    let along = spacing - carried;
    while (along <= segment) {
      const t = along / segment;
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      along += spacing;
    }
    carried = segment - (along - spacing);
  }
  const last = line[line.length - 1];
  if (last) out.push(last);
  return out;
};

const cacheDir = resolve(scriptDir, '..', 'node_modules', '.cache', 'demo-routes');

const readCache = (key: string, count: number): number[] | undefined => {
  const path = resolve(cacheDir, `${key}.json`);
  if (!existsSync(path)) return undefined;
  const cached = JSON.parse(readFileSync(path, 'utf8')) as number[];
  if (cached.length !== count) return undefined;
  return cached;
};

const writeCache = (key: string, values: number[]) => {
  mkdirSync(cacheDir, { recursive: true });
  writeFileSync(resolve(cacheDir, `${key}.json`), JSON.stringify(values));
};

const fetchSampleElevations = async (samples: Array<[number, number]>): Promise<number[]> => {
  const result: number[] = [];
  for (let i = 0; i < samples.length; i += ELEVATION_BATCH) {
    const batch = samples.slice(i, i + ELEVATION_BATCH);
    const lats = batch.map((p) => p[0].toFixed(5)).join(',');
    const lngs = batch.map((p) => p[1].toFixed(5)).join(',');
    const data = (await fetchJson(`${ELEVATION_URL}?latitude=${lats}&longitude=${lngs}`)) as {
      elevation?: number[];
    };
    if (!data.elevation || data.elevation.length !== batch.length) {
      throw new Error('Elevation response does not match the request');
    }
    result.push(...data.elevation);
    await sleep(ELEVATION_PAUSE_MS);
  }
  return result;
};

// DEM cells next to cliffs and cuttings spike; a running median drops them.
const MEDIAN_RADIUS = 2;

const medianFilter = (values: number[]): number[] =>
  values.map((_, i) => {
    const window = values
      .slice(Math.max(0, i - MEDIAN_RADIUS), i + MEDIAN_RADIUS + 1)
      .sort((a, b) => a - b);
    return window[Math.floor(window.length / 2)] ?? 0;
  });

const sampleIndices = (count: number): number[] => {
  const indices: number[] = [];
  for (let i = 0; i < count - 1; i += ELEVATION_STRIDE) indices.push(i);
  indices.push(count - 1);
  return indices;
};

const fetchElevations = async (key: string, points: Array<[number, number]>): Promise<number[]> => {
  const indices = sampleIndices(points.length);
  let sampled = readCache(key, indices.length);
  if (!sampled) {
    sampled = await fetchSampleElevations(
      indices.map((i) => points[i]).filter((p): p is [number, number] => p !== undefined),
    );
    writeCache(key, sampled);
  }
  sampled = medianFilter(sampled);
  const values: number[] = [];
  for (let s = 0; s < indices.length - 1; s++) {
    const from = indices[s] ?? 0;
    const to = indices[s + 1] ?? from;
    const a = sampled[s] ?? 0;
    const b = sampled[s + 1] ?? a;
    for (let i = from; i < to; i++) values.push(a + ((b - a) * (i - from)) / (to - from));
  }
  values.push(sampled[sampled.length - 1] ?? 0);
  return values;
};

// The DEM is ~90 m; a short moving average removes the stair steps between cells.
const smooth = (values: number[]): number[] =>
  values.map((_, i) => {
    let sum = 0;
    let count = 0;
    for (let j = i - SMOOTH_RADIUS; j <= i + SMOOTH_RADIUS; j++) {
      const v = values[j];
      if (v === undefined) continue;
      sum += v;
      count++;
    }
    return Math.round((sum / count) * 10) / 10;
  });

const buildRoute = async (config: RouteConfig): Promise<OutputRoute> => {
  const line = await fetchGeometry(config);
  const points = resample(line, SPACING_M[config.profile]).map(
    ([lat, lng]) => [Math.round(lat * 1e5) / 1e5, Math.round(lng * 1e5) / 1e5] as [number, number],
  );
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    if (a && b) length += haversineM(a, b);
  }
  console.log(`${config.key}: ${(length / 1000).toFixed(1)} km, ${points.length} points`);
  let elevations: number[] = [];
  if (!DRY_RUN) {
    elevations = smooth(await fetchElevations(config.key, points));
  }
  let sport: OutputRoute['sport'] = 'cycling';
  if (config.profile === 'foot') {
    sport = 'running';
  }
  return { key: config.key, name: config.name, sport, polyline: encode(points, 5), elevations };
};

const main = async () => {
  const output: Record<Group, OutputRoute[]> = { routes: [], trip: [], studio: [] };
  for (const config of ROUTE_CONFIGS) {
    await sleep(500);
    output[config.group].push(await buildRoute(config));
  }
  const outPath = resolve(scriptDir, '..', 'src', 'features', 'demo', 'demoRoutes.json');
  if (DRY_RUN) return;
  writeFileSync(outPath, JSON.stringify(output) + '\n');
  console.log(`\nWrote ${ROUTE_CONFIGS.length} routes to ${outPath}`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
