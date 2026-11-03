import { writeFileSync } from 'node:fs';
import { buildDemoDataset, DEMO_SEED } from '@/components/demo/buildDemoDataset.ts';
import { parseDemoRoutes } from '@/lib/demo/demoRecords.ts';
import routesJson from '@/lib/demo/demoRoutes.json';
import { windowedGradients } from '@pacevault/engine/gradient.ts';
import { gradeAdjustedPaceFactor } from '@pacevault/engine/normalizedEffort.ts';
import { stepsPerMinute } from '@pacevault/engine/cadence.ts';
import type { SessionRecord, Sport } from '@pacevault/engine/types.ts';
import { detectSegmentsForSport, type DetectedPass, type DetectedSegment } from './detect.ts';

const TODAY = new Date(2026, 10, 2);
const MIN_SAMPLES_PER_PASS = 24;
const MAX_SAMPLES_PER_PASS = 80;
const SECONDS_PER_SAMPLE = 6;
const SPORTS: Sport[] = ['running', 'cycling'];
const OUT_FILE = process.argv[2] ?? 'segments.json';

const routes = parseDemoRoutes(routesJson);
if (!routes) throw new Error('Demo routes are invalid');
const dataset = buildDemoDataset({ seed: DEMO_SEED, today: TODAY, routes });
const recordsById = new Map(dataset.sessionData.map((d) => [d.sessionId, d.records]));
const sessions = dataset.sessions.map((s) => ({ id: s.id, sport: s.sport, date: s.date, records: recordsById.get(s.id) ?? [] }));
const sessionById = new Map(dataset.sessions.map((s) => [s.id, s]));
const gradientsById = new Map<string, Array<number | undefined>>();

const round = (value: number | null, digits: number) => {
  if (value === null) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const mean = (values: Array<number | undefined>) => {
  const present = values.filter((v): v is number => v !== undefined);
  if (present.length === 0) return null;
  return present.reduce((sum, v) => sum + v, 0) / present.length;
};

const scaled = (value: number | null, factor: number) => {
  if (value === null) return null;
  return value * factor;
};

const withValues = (values: Array<number | null>) => {
  if (values.some((v) => v !== null)) return values;
  return null;
};

const paceFromSpeed = (speed: number | null) => {
  if (speed === null || speed === 0) return null;
  return 1000 / speed;
};

const gradientsFor = (sessionId: string, records: SessionRecord[]) => {
  const cached = gradientsById.get(sessionId);
  if (cached) return cached;
  const gradients = windowedGradients(records);
  gradientsById.set(sessionId, gradients);
  return gradients;
};

const passSeries = ({ pass, sport }: { pass: DetectedPass; sport: Sport }) => {
  const records = recordsById.get(pass.sessionId) ?? [];
  const gradients = gradientsFor(pass.sessionId, records);
  const indexed = records.map((record, index) => ({ record, index })).filter((r) => r.record.timestamp >= pass.startTimeSeconds && r.record.timestamp <= pass.endTimeSeconds);
  const wanted = Math.max(MIN_SAMPLES_PER_PASS, Math.min(MAX_SAMPLES_PER_PASS, Math.round(pass.seconds / SECONDS_PER_SAMPLE)));
  const buckets = Math.min(wanted, Math.max(2, indexed.length));
  const series = { t: [] as number[], lat: [] as number[], lng: [] as number[], hr: [] as Array<number | null>, power: [] as Array<number | null>, speed: [] as Array<number | null>, pace: [] as Array<number | null>, gap: [] as Array<number | null>, cadence: [] as Array<number | null>, elevation: [] as Array<number | null>, grade: [] as Array<number | null> };
  for (let b = 0; b < buckets; b++) {
    const slice = indexed.slice(Math.floor((b / buckets) * indexed.length), Math.max(Math.floor(((b + 1) / buckets) * indexed.length), Math.floor((b / buckets) * indexed.length) + 1));
    const centre = slice[Math.floor(slice.length / 2)];
    if (centre === undefined) continue;
    const speed = mean(slice.map((r) => r.record.speed));
    const pace = paceFromSpeed(speed);
    const gradient = mean(slice.map((r) => gradients[r.index]));
    let cadence = mean(slice.map((r) => r.record.cadence));
    if (cadence !== null && sport === 'running') cadence = stepsPerMinute(cadence);
    let gap: number | null = null;
    if (sport === 'running' && pace !== null && gradient !== null) gap = pace / gradeAdjustedPaceFactor(gradient);
    series.t.push(Math.round(centre.record.timestamp - pass.startTimeSeconds));
    series.lat.push(round(centre.record.lat ?? 0, 5) ?? 0);
    series.lng.push(round(centre.record.lng ?? 0, 5) ?? 0);
    series.hr.push(round(mean(slice.map((r) => r.record.hr)), 0));
    series.power.push(round(mean(slice.map((r) => r.record.power)), 0));
    series.speed.push(round(scaled(speed, 3.6), 1));
    let runningPace: number | null = null;
    if (sport === 'running') runningPace = pace;
    series.pace.push(round(runningPace, 0));
    series.gap.push(round(gap, 0));
    series.cadence.push(round(cadence, 0));
    series.elevation.push(round(mean(slice.map((r) => r.record.elevation)), 1));
    series.grade.push(round(scaled(gradient, 100), 1));
  }
  return Object.fromEntries(Object.entries(series).map((entry) => [entry[0], withValues(entry[1])]));
};

const outputPass = ({ pass, sport }: { pass: DetectedPass; sport: Sport }) => {
  const session = sessionById.get(pass.sessionId);
  return {
    sessionId: pass.sessionId,
    sessionName: session?.name ?? '',
    date: session?.date ?? 0,
    sessionDistanceMeters: session?.distance ?? null,
    sessionDurationSeconds: session?.duration ?? null,
    seconds: Math.round(pass.seconds),
    coverage: round(pass.coverage, 3),
    splitSeconds: pass.splitSeconds.map((s) => Math.round(s)),
    series: passSeries({ pass, sport }),
  };
};

const lastRidden = (segment: DetectedSegment) => Math.max(...segment.passes.map((p) => sessionById.get(p.sessionId)?.date ?? 0));

const output: Record<string, unknown> = { today: TODAY.getTime(), sports: {} };
const sportsOut: Record<string, unknown> = {};
for (const sport of SPORTS) {
  const startedAt = Date.now();
  const detected = detectSegmentsForSport({ sport, sessions });
  const ordered = [...detected.segments].sort((a, b) => lastRidden(b) - lastRidden(a));
  const counters = new Map<string, number>();
  const segments = ordered.map((segment) => {
    const typeNumber = (counters.get(segment.type) ?? 0) + 1;
    counters.set(segment.type, typeNumber);
    const lead = sessionById.get(segment.leadSessionId);
    return {
      id: `${sport}-${segment.type}-${typeNumber}`,
      sport,
      type: segment.type,
      typeNumber,
      leadSessionName: lead?.name ?? '',
      distanceMeters: Math.round(segment.distanceMeters),
      netElevationMeters: Math.round(segment.netElevationMeters),
      geometry: segment.geometry,
      passes: segment.passes.map((pass) => outputPass({ pass, sport })),
    };
  });
  sportsOut[sport] = { stats: { ...detected.stats, milliseconds: Date.now() - startedAt }, segments };
  console.log(sport, detected.stats, Date.now() - startedAt, 'ms');
  for (const s of segments) {
    console.log(`  ${s.id.padEnd(22)} ${String(s.distanceMeters).padStart(6)} m ${String(s.netElevationMeters).padStart(4)} m  ${String(s.passes.length).padStart(3)} passes  lead "${s.leadSessionName}"  names: ${[...new Set(s.passes.map((p) => p.sessionName))].join(' | ')}`);
  }
}
output.sports = sportsOut;
const json = JSON.stringify(output);
writeFileSync(OUT_FILE, json);
console.log('wrote', OUT_FILE, (json.length / 1024).toFixed(0), 'KiB');
