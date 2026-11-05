import { MS_PER_DAY } from '@pacevault/engine/time.ts';

export interface Pass {
  id: string;
  name: string;
  date: number;
  durationSec: number;
}

export type Scenario = 'from' | 'latest' | 'best' | 'many' | 'few';

export const SCENARIOS: Array<{ id: Scenario; label: string }> = [
  { id: 'from', label: 'From a session' },
  { id: 'latest', label: 'Latest' },
  { id: 'best', label: 'Best' },
  { id: 'many', label: '90 passes' },
  { id: 'few', label: '3 passes' },
];

const NAMES = ['Isar easy', 'Morning run', 'Tempo 6 km', 'Long run', 'Evening run', 'Fartlek', 'Recovery 8 km', 'Sunday loop', '6×800 m Isar', 'Hot one'];

const passesFrom = (rows: Array<[number, number]>): Pass[] =>
  rows.map((row, index) => ({
    id: `p${index}`,
    name: NAMES[(index * 7) % NAMES.length] ?? 'Run',
    date: row[0],
    durationSec: row[1],
  }));

const day = (iso: string): number => new Date(iso).getTime();

const TWELVE = passesFrom([
  [day('2026-01-11'), 402],
  [day('2026-02-02'), 396],
  [day('2026-02-21'), 405],
  [day('2026-03-15'), 391],
  [day('2026-04-04'), 387],
  [day('2026-04-26'), 452],
  [day('2026-05-24'), 382],
  [day('2026-06-14'), 360],
  [day('2026-07-09'), 378],
  [day('2026-08-22'), 372],
  [day('2026-09-12'), 375],
  [day('2026-10-03'), 366],
]);

const NINETY = (() => {
  let seed = 7;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const start = day('2024-10-20');
  const rows: Array<[number, number]> = [];
  for (let index = 0; index < 90; index++) {
    let durationSec = Math.round(412 - 48 * (index / 89) + (random() - 0.5) * 26);
    if (index === 31) durationSec += 72;
    if (index === 64) durationSec += 50;
    rows.push([start + Math.round(index * 8.2) * MS_PER_DAY, durationSec]);
  }
  return passesFrom(rows);
})();

const THREE = passesFrom([
  [day('2026-08-02'), 381],
  [day('2026-09-12'), 372],
  [day('2026-10-03'), 366],
]);

export const PASSES_BY_SCENARIO: Record<Scenario, Pass[]> = {
  from: TWELVE,
  latest: TWELVE,
  best: TWELVE,
  many: NINETY,
  few: THREE,
};

export const bestOf = (passes: Pass[]): Pass =>
  passes.reduce((best, pass) => {
    if (pass.durationSec < best.durationSec) return pass;
    return best;
  });

export const initialSelection = ({ scenario, passes }: { scenario: Scenario; passes: Pass[] }): string => {
  if (scenario === 'best') return bestOf(passes).id;
  if (scenario === 'from') return passes[passes.length - 3]?.id ?? '';
  if (scenario === 'few') return passes[1]?.id ?? '';
  return passes[passes.length - 1]?.id ?? '';
};

const ROBUST_QUANTILE = 0.9;

export interface DotPosition {
  ratio: number;
  clamped: boolean;
}

export const dotScale = (passes: Pass[]): ((durationSec: number) => DotPosition) => {
  const sorted = passes.map((pass) => pass.durationSec).sort((a, b) => a - b);
  const fastest = sorted[0] ?? 0;
  const slowEdge = sorted[Math.floor(ROBUST_QUANTILE * (sorted.length - 1))] ?? fastest;
  const span = Math.max(1, slowEdge - fastest);
  return (durationSec) => {
    const ratio = (durationSec - fastest) / span;
    return { ratio: Math.min(1, ratio), clamped: ratio > 1 };
  };
};

export type Channel = 'hr' | 'pace' | 'power' | 'cadence';

export const CHANNELS: Channel[] = ['hr', 'pace', 'power', 'cadence'];

const BASE_BY_CHANNEL: Record<Channel, { level: number; swing: number }> = {
  hr: { level: 152, swing: 9 },
  pace: { level: 300, swing: 18 },
  power: { level: 265, swing: 30 },
  cadence: { level: 172, swing: 5 },
};

const STEP_SEC = 10;

export const channelSeries = ({ pass, channel }: { pass: Pass; channel: Channel }): Array<{ elapsedSec: number; value: number }> => {
  const base = BASE_BY_CHANNEL[channel];
  const seed = Number(pass.id.slice(1)) * 1.37 + 0.4;
  const effort = (pass.durationSec - 360) / 60;
  const points = [];
  for (let elapsedSec = 0; elapsedSec <= pass.durationSec; elapsedSec += STEP_SEC) {
    const phase = elapsedSec / 60;
    const wave = Math.sin(phase * 1.3 + seed) + 0.45 * Math.sin(phase * 3.1 + seed * 2);
    let value = base.level + base.swing * wave;
    if (channel === 'hr') value -= effort * 4;
    if (channel === 'pace') value += effort * 12;
    if (channel === 'power') value -= effort * 14;
    points.push({ elapsedSec, value: Math.round(value) });
  }
  return points;
};

export const averageOf = (points: Array<{ value: number }>): number =>
  points.reduce((sum, point) => sum + point.value, 0) / Math.max(1, points.length);
