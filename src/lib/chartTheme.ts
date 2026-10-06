import { tokens } from './tokens';

export const formatChartTime = (minutes: number): string => {
  const totalSec = Math.round(minutes * 60);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const NICE_STEPS = [1, 2, 5, 10];
const DEFAULT_TICK_COUNT = 5;
const PADDING_RATIO = 0.1;
const FLAT_PADDING_RATIO = 0.05;

const niceStep = (rough: number): number => {
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const normalized = rough / magnitude;
  const step = NICE_STEPS.find((candidate) => candidate >= normalized) ?? 10;
  return step * magnitude;
};

const roundToStep = (value: number): number => Number(value.toPrecision(12));

export const niceAxis = (
  values: Array<number | null | undefined>,
  tickCount: number = DEFAULT_TICK_COUNT,
): { domain: [number, number]; ticks: number[] } | undefined => {
  const present = values.filter((v): v is number => v !== null && v !== undefined);
  if (present.length === 0) return undefined;
  const min = Math.min(...present);
  const max = Math.max(...present);
  let padding = (max - min) * PADDING_RATIO;
  if (padding === 0) {
    padding = Math.max(Math.abs(max) * FLAT_PADDING_RATIO, 1);
  }
  const low = min - padding;
  const high = max + padding;
  const step = niceStep((high - low) / Math.max(1, tickCount - 1));
  const start = roundToStep(Math.floor(low / step) * step);
  const end = roundToStep(Math.ceil(high / step) * step);
  const ticks: number[] = [];
  for (let tick = start; tick <= end + step / 2; tick += step) {
    ticks.push(roundToStep(tick));
  }
  return { domain: [start, end], ticks };
};

export const formatTick = (v: number, unit?: string): string => {
  const rounded = Math.round(v * 10) / 10;
  const label = `${rounded}`;
  if (unit) {
    return `${label} ${unit}`;
  }
  return label;
};

export const formatChartDate = (isoDate: string): string => {
  const d = new Date(isoDate);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' });
};

/**
 * X-axis variant for the shared detail charts: sessions plot over elapsed
 * time, studio routes over cumulative distance.
 */
export interface ChartXAxis<K extends string> {
  key: K;
  /** Recharts syncId linking the compact charts' tooltips and zoom. */
  syncId: string;
  type: 'number' | 'category';
  tickFormatter: (v: number) => string;
}

export const sessionTimeXAxis: ChartXAxis<'time'> = {
  key: 'time',
  syncId: 'session-detail',
  type: 'category',
  tickFormatter: formatChartTime,
};

export const routeDistanceXAxis: ChartXAxis<'dist'> = {
  key: 'dist',
  syncId: 'studio-detail',
  type: 'number',
  tickFormatter: (v: number) => formatTick(v, 'km'),
};

export const chartTheme = {
  tick: { fill: tokens.textTertiary, fontSize: 11 },
  compactYAxisWidth: 36,
  axisLine: { stroke: tokens.border },
  tooltip: {
    contentStyle: {
      backgroundColor: 'rgba(17, 19, 24, 0.85)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: tokens.radiusMd,
      fontSize: '12px',
    },
    labelStyle: { color: tokens.textSecondary },
    isAnimationActive: false,
    separator: ': ',
  },
} as const;
