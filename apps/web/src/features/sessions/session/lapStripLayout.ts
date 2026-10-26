import { tokens } from '@pacevault/ui/lib/tokens.ts';
import { summarizeLaps, type LapSet, type LapAnalysis, type LapBand } from '@/lib/laps.ts';

export const FASTER = tokens.chartPace;
export const SLOWER = tokens.chartCadence;

export interface StripBar {
  lapIndex: number;
  x: number;
  width: number;
  y: number;
  height: number;
  fill: string;
  opacity: number;
}

interface StripSpan {
  lapIndex: number;
  x: number;
  width: number;
}

interface StripLayout {
  bars: StripBar[];
  spans: StripSpan[];
  partialPresent: boolean;
}

interface StripContext {
  first: LapBand;
  total: number;
  width: number;
  gap: number;
  mid: number;
  maxDeviation: number;
  byIndex: Map<number, LapAnalysis>;
  deviationOf: (band: LapBand) => number | undefined;
}

const maxDeviation = ({
  bands,
  deviationOf,
}: {
  bands: LapBand[];
  deviationOf: (band: LapBand) => number | undefined;
}): number => {
  let largest = 1;
  for (const band of bands) {
    const deviation = deviationOf(band);
    if (deviation !== undefined) largest = Math.max(largest, Math.abs(deviation));
  }
  return largest;
};

const barGeometry = ({
  x,
  span,
  gap,
}: {
  x: number;
  span: number;
  gap: number;
}): { x: number; width: number } => {
  let barGap = 0.3;
  if (span > 3) barGap = gap;
  return { x: x + barGap / 2, width: Math.max(0.6, span - barGap) };
};

const deviationBar = ({
  deviation,
  context,
}: {
  deviation: number;
  context: StripContext;
}): { y: number; height: number; fill: string } => {
  const barHeight = Math.max(1.2, (Math.abs(deviation) / context.maxDeviation) * (context.mid - 1));
  let y = context.mid;
  let fill: string = SLOWER;
  if (deviation >= 0) {
    y = context.mid - barHeight;
    fill = FASTER;
  }
  return { y, height: barHeight, fill };
};

const layoutBar = ({
  band,
  context,
}: {
  band: LapBand;
  context: StripContext;
}): { span: StripSpan; bar: StripBar; partial: boolean } => {
  const x = ((band.from - context.first.from) / context.total) * context.width;
  const span = ((band.to - band.from) / context.total) * context.width;
  const geometry = barGeometry({ x, span, gap: context.gap });
  const partial = context.byIndex.get(band.lapIndex)?.partial === true;
  let opacity = 0.9;
  if (partial) opacity = 0.35;
  const deviation = context.deviationOf(band);
  if (deviation === undefined) {
    return {
      span: { lapIndex: band.lapIndex, x, width: span },
      partial,
      bar: {
        lapIndex: band.lapIndex,
        x: geometry.x,
        width: geometry.width,
        y: context.mid - 0.6,
        height: 1.2,
        fill: tokens.white30,
        opacity: 1,
      },
    };
  }
  const shape = deviationBar({ deviation, context });
  return {
    span: { lapIndex: band.lapIndex, x, width: span },
    partial,
    bar: {
      lapIndex: band.lapIndex,
      x: geometry.x,
      width: geometry.width,
      y: shape.y,
      height: shape.height,
      fill: shape.fill,
      opacity,
    },
  };
};

export const layoutStrip = ({
  set,
  width,
  height,
  gap,
}: {
  set: LapSet;
  width: number;
  height: number;
  gap: number;
}): StripLayout => {
  const bands = set.bands;
  const first = bands[0];
  const last = bands[bands.length - 1];
  if (!first || !last || last.to <= first.from)
    return { bars: [], spans: [], partialPresent: false };
  const total = last.to - first.from;
  const byIndex = new Map(set.analysis.map((lap) => [lap.lapIndex, lap]));
  const average = summarizeLaps(set).avgSecPerKm;
  const deviationOf = (band: LapBand): number | undefined => {
    const pace = byIndex.get(band.lapIndex)?.paceSecPerKm;
    if (pace === undefined || average === undefined) return undefined;
    return average - pace;
  };
  const context: StripContext = {
    first,
    total,
    width,
    gap,
    mid: height / 2,
    maxDeviation: maxDeviation({ bands, deviationOf }),
    byIndex,
    deviationOf,
  };
  const layouts = bands.map((band) => layoutBar({ band, context }));
  return {
    bars: layouts.map((layout) => layout.bar),
    spans: layouts.map((layout) => layout.span),
    partialPresent: layouts.some((layout) => layout.partial),
  };
};
