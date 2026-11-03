import rawData from './segments.json';

export type Sport = 'running' | 'cycling';
export type SegmentType = 'climb' | 'flat' | 'descent' | 'route';
export type Channel = 'hr' | 'power' | 'speed' | 'pace' | 'gap' | 'elevation' | 'grade' | 'cadence';

export interface PassSeries {
  t: number[];
  lat: number[];
  lng: number[];
  hr: Array<number | null> | null;
  power: Array<number | null> | null;
  speed: Array<number | null> | null;
  pace: Array<number | null> | null;
  gap: Array<number | null> | null;
  cadence: Array<number | null> | null;
  elevation: Array<number | null> | null;
  grade: Array<number | null> | null;
}

export interface Pass {
  sessionId: string;
  sessionName: string;
  date: number;
  sessionDistanceMeters: number | null;
  sessionDurationSeconds: number | null;
  seconds: number;
  coverage: number;
  splitSeconds: number[];
  series: PassSeries;
}

export interface Segment {
  id: string;
  sport: Sport;
  type: SegmentType;
  typeNumber: number;
  leadSessionName: string;
  distanceMeters: number;
  netElevationMeters: number;
  geometry: Array<[number, number]>;
  passes: Pass[];
}

interface SportData {
  segments: Segment[];
}

interface SegmentData {
  today: number;
  sports: Record<Sport, SportData>;
}

export const DATA = rawData as unknown as SegmentData;

export const SPORTS: Sport[] = ['running', 'cycling'];

export const segmentsOf = (sport: Sport): Segment[] => DATA.sports[sport].segments;

export const sportsWithSegments = (): Sport[] => SPORTS.filter((sport) => segmentsOf(sport).length > 0);

export const bestPass = (segment: Segment): Pass => {
  let best = segment.passes[0];
  for (const pass of segment.passes) if (best === undefined || pass.seconds < best.seconds) best = pass;
  if (best === undefined) throw new Error('A segment has at least two passes');
  return best;
};

export const latestPass = (segment: Segment): Pass => {
  let latest = segment.passes[0];
  for (const pass of segment.passes) if (latest === undefined || pass.date > latest.date) latest = pass;
  if (latest === undefined) throw new Error('A segment has at least two passes');
  return latest;
};

export const passesFastestFirst = (segment: Segment): Pass[] => [...segment.passes].sort((a, b) => a.seconds - b.seconds);

export const passesByDate = (segment: Segment): Pass[] => [...segment.passes].sort((a, b) => a.date - b.date);

const ROLLING_WINDOW = 5;

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle] ?? 0;
  return ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
};

export const rollingMedian = (passes: Pass[]): number[] =>
  passes.map((_, i) => median(passes.slice(Math.max(0, i - ROLLING_WINDOW + 1), i + 1).map((p) => p.seconds)));

export const positionAt = (pass: Pass, seconds: number): [number, number] | undefined => {
  const t = pass.series.t;
  if (t.length === 0) return undefined;
  const clamped = Math.max(0, Math.min(pass.seconds, seconds));
  let i = 0;
  while (i < t.length - 1 && (t[i + 1] ?? 0) < clamped) i += 1;
  const fromT = t[i] ?? 0;
  const toT = t[i + 1];
  const fromLat = pass.series.lat[i] ?? 0;
  const fromLng = pass.series.lng[i] ?? 0;
  if (toT === undefined || toT <= fromT || clamped <= fromT) return [fromLat, fromLng];
  const fraction = (clamped - fromT) / (toT - fromT);
  return [
    fromLat + ((pass.series.lat[i + 1] ?? fromLat) - fromLat) * fraction,
    fromLng + ((pass.series.lng[i + 1] ?? fromLng) - fromLng) * fraction,
  ];
};

export const valueAt = ({ pass, channel, seconds }: { pass: Pass; channel: Channel; seconds: number }): number | null => {
  const values = pass.series[channel];
  if (values === null || seconds > pass.seconds || seconds < 0) return null;
  const t = pass.series.t;
  let nearest = 0;
  for (let i = 0; i < t.length; i++) {
    if (Math.abs((t[i] ?? 0) - seconds) < Math.abs((t[nearest] ?? 0) - seconds)) nearest = i;
  }
  return values[nearest] ?? null;
};

export const SCATTER_WINDOW_PASSES = 10;

export const latestWindowIds = (segment: Segment): Set<string> | null => {
  if (segment.passes.length <= SCATTER_WINDOW_PASSES) return null;
  return new Set(passesByDate(segment).slice(-SCATTER_WINDOW_PASSES).map((p) => p.sessionId));
};
