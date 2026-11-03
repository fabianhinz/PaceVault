// Baseline for the segment detector: parses a folder of FIT/GPX files with the app's
// parsers, runs the current engine detection per sport and prints counts, overlap and timing.
// BENCH_DIR=<folder with .fit/.gpx>  BENCH_JSON=<optional output file>  BENCH_GPX_SPORT=running|cycling
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { it } from 'vite-plus/test';
import { parseFitFile } from '@/parsers/fit.ts';
import { parseGpx } from '@pacevault/gpx/parseGpx.ts';
import { haversineDistanceMeters } from '@pacevault/engine/geodesy.ts';
import {
  segmentDetectionResult,
  segmentTrack,
  type DetectedSegment,
  type SegmentTrack,
} from '@pacevault/engine/segments.ts';
import type { SessionRecord, Sport } from '@pacevault/engine/types.ts';

interface BenchSession {
  id: string;
  sport: Sport;
  date: number;
  records: SessionRecord[];
}

const OVERLAP_CELL_METERS = 20;
const SAMPLE_STEP_METERS = 5;
const PROFILE = { restHr: 50, maxHr: 190, gender: 'male' as const };

const listFiles = (dir: string): string[] =>
  readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((name) => /\.(fit|gpx)$/i.test(name))
    .map((name) => path.join(dir, name));

const gpxSport = (text: string): Sport => {
  const type = /<type>([^<]+)<\/type>/i.exec(text)?.[1]?.toLowerCase() ?? '';
  if (/bik|cycl|ride/.test(type)) return 'cycling';
  if (/run/.test(type)) return 'running';
  if (process.env.BENCH_GPX_SPORT === 'cycling') return 'cycling';
  return 'running';
};

const gpxSession = (file: string): BenchSession | undefined => {
  const text = readFileSync(file, 'utf8');
  const parsed = parseGpx(text);
  if (!parsed) return undefined;
  const times = [...text.matchAll(/<trkpt[\s\S]*?<\/trkpt>/g)].map((match) => {
    const time = /<time>([^<]+)<\/time>/.exec(match[0])?.[1];
    if (time === undefined) return undefined;
    return Date.parse(time);
  });
  const timed = times.length === parsed.points.length && times.every((t) => t !== undefined);
  const start = timed ? (times[0] ?? 0) : 0;
  let distance = 0;
  const records = parsed.points.map((point, i): SessionRecord => {
    const previous = parsed.points[i - 1];
    if (previous) distance += haversineDistanceMeters({ from: previous, to: point });
    const timestamp = timed ? ((times[i] ?? start) - start) / 1000 : i;
    return { timestamp, lat: point.lat, lng: point.lng, distance, elevation: point.ele ?? undefined };
  });
  return { id: path.basename(file), sport: gpxSport(text), date: start, records };
};

const fitSession = async (file: string): Promise<BenchSession | undefined> => {
  const buffer = readFileSync(file);
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  try {
    const parsed = await parseFitFile({ arrayBuffer, fileName: path.basename(file), profileAt: () => PROFILE });
    return { id: path.basename(file), sport: parsed.session.sport, date: parsed.session.date, records: parsed.records };
  } catch (error) {
    console.warn(`skip ${file}: ${String(error)}`);
    return undefined;
  }
};

const cellsOf = (geometry: Array<[number, number]>, metersPerDegreeLng: number): Set<string> => {
  const cells = new Set<string>();
  for (let i = 1; i < geometry.length; i++) {
    const from = geometry[i - 1];
    const to = geometry[i];
    if (!from || !to) continue;
    const meters = haversineDistanceMeters({ from: { lat: from[0], lng: from[1] }, to: { lat: to[0], lng: to[1] } });
    const steps = Math.max(1, Math.ceil(meters / SAMPLE_STEP_METERS));
    for (let s = 0; s <= steps; s++) {
      const lat = from[0] + ((to[0] - from[0]) * s) / steps;
      const lng = from[1] + ((to[1] - from[1]) * s) / steps;
      cells.add(`${Math.floor((lat * 110540) / OVERLAP_CELL_METERS)},${Math.floor((lng * metersPerDegreeLng) / OVERLAP_CELL_METERS)}`);
    }
  }
  return cells;
};

const overlapStats = (segments: DetectedSegment[]) => {
  const referenceLat = segments[0]?.geometry[0]?.[0] ?? 0;
  const metersPerDegreeLng = 111320 * Math.cos((referenceLat * Math.PI) / 180);
  const counts = new Map<string, number>();
  for (const segment of segments) {
    for (const cell of cellsOf(segment.geometry, metersPerDegreeLng)) counts.set(cell, (counts.get(cell) ?? 0) + 1);
  }
  let overlappingCells = 0;
  let maxCover = 0;
  for (const count of counts.values()) {
    if (count >= 2) overlappingCells += 1;
    maxCover = Math.max(maxCover, count);
  }
  return {
    coveredKm: (counts.size * OVERLAP_CELL_METERS) / 1000,
    overlappingKm: (overlappingCells * OVERLAP_CELL_METERS) / 1000,
    maxSegmentsOnOnePoint: maxCover,
  };
};

const sportReport = ({ sport, sessions }: { sport: Sport; sessions: BenchSession[] }) => {
  const own = sessions.filter((session) => session.sport === sport);
  const trackStart = performance.now();
  const tracks: SegmentTrack[] = own.flatMap((session) => {
    const track = segmentTrack({ sessionId: session.id, sport, date: session.date, records: session.records });
    return track ? [track] : [];
  });
  const trackMs = performance.now() - trackStart;
  const detectStart = performance.now();
  const result = segmentDetectionResult({ sport, tracks, clockMs: () => performance.now() });
  const detectMs = performance.now() - detectStart;
  const segments = result.segments;
  const routes = segments.filter((segment) => segment.type === 'route');
  const byType = { climb: 0, flat: 0, descent: 0, route: 0 };
  for (const segment of segments) byType[segment.type] += 1;
  const sessionsInRoutes = new Set(routes.flatMap((route) => route.passes.map((pass) => pass.sessionId)));
  return {
    sport,
    sessions: own.length,
    tracks: tracks.length,
    resampledPoints: tracks.reduce((sum, track) => sum + track.points.length, 0),
    segments: segments.length,
    byType,
    passes: segments.reduce((sum, segment) => sum + segment.passes.length, 0),
    routes: {
      count: routes.length,
      sessionsInAnyRoute: sessionsInRoutes.size,
      passesPerRoute: routes.map((route) => route.passes.length),
    },
    overlapAll: overlapStats(segments),
    overlapWithoutRoutes: overlapStats(segments.filter((segment) => segment.type !== 'route')),
    ms: { segmentTrack: Math.round(trackMs), detection: Math.round(detectMs), phases: result.stats.msByPhase },
    engine: { ...result.stats, msByPhase: undefined },
  };
};

it('runs the detection bench', async () => {
  const dir = process.env.BENCH_DIR ?? path.join(tmpdir(), 'pv-detect-bench-demo');
  const files = listFiles(dir);
  const parseStart = performance.now();
  const sessions: BenchSession[] = [];
  for (const file of files) {
    const session = /\.fit$/i.test(file) ? await fitSession(file) : gpxSession(file);
    if (session) sessions.push(session);
  }
  const parseMs = Math.round(performance.now() - parseStart);
  const report = {
    input: { dir, files: files.length, sessions: sessions.length, parseMs },
    sports: (['running', 'cycling'] as const).map((sport) => sportReport({ sport, sessions })),
  };
  console.log(JSON.stringify(report, (_key, value) => (typeof value === 'number' && !Number.isInteger(value) ? Math.round(value * 10) / 10 : value), 2));
  if (process.env.BENCH_JSON) writeFileSync(process.env.BENCH_JSON, JSON.stringify(report, null, 2));
});
