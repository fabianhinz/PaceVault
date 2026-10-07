import type { ReactNode } from 'react';
import { m } from '@/paraglide/messages.js';
import { cn } from '@/lib/utils.ts';
import { tokens } from '@/lib/tokens.ts';
import { MIN_SUMMARY_LAPS, summarizeLaps } from '@/lib/lapSummary.ts';
import type { LapSet } from '@/lib/lapSet.ts';
import type { LapAnalysis } from '@/lib/laps.ts';
import type { LapBand } from '@/lib/lapRanges.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';

const MANY_LAPS = 20;
const FASTER = tokens.chartPace;
const SLOWER = tokens.chartCadence;

const cellColor = (lap: LapAnalysis | undefined, position: number): string => {
  if (lap?.isPartial) return 'rgba(255,255,255,.3)';
  if (lap?.intensity === 'warmup' || lap?.intensity === 'cooldown') return 'rgba(255,255,255,.35)';
  if (lap && lap.intensity !== 'active') return 'rgba(255,255,255,.18)';
  if (position % 2 === 0) return 'rgba(255,255,255,.75)';
  return 'rgba(255,255,255,.5)';
};

export const LapSwatch = (props: { set: LapSet | null; muted?: boolean }) => {
  const bands = props.set?.bands ?? [];
  const first = bands[0];
  const last = bands[bands.length - 1];
  const className = cn(
    'flex h-2 w-12 shrink-0 overflow-hidden rounded-full',
    props.muted && 'opacity-30 grayscale',
  );
  if (!props.set || !first || !last || last.to <= first.from) {
    return <span aria-hidden className={cn(className, 'bg-white/12')} />;
  }
  const byIndex = new Map(props.set.analysis.map((lap) => [lap.lapIndex, lap]));
  return (
    <span aria-hidden className={cn(className, bands.length <= MANY_LAPS && 'gap-px')}>
      {bands.map((band, position) => (
        <i
          key={band.lapIndex}
          className="block h-full"
          style={{
            flexGrow: band.to - band.from,
            flexBasis: 0,
            background: cellColor(byIndex.get(band.lapIndex), position),
          }}
        />
      ))}
    </span>
  );
};

interface StripBar {
  lapIndex: number;
  x: number;
  width: number;
  y: number;
  height: number;
  fill: string;
  opacity: number;
}

interface StripLayout {
  bars: StripBar[];
  spans: Array<{ lapIndex: number; x: number; width: number }>;
  hasPartial: boolean;
}

const layoutStrip = (set: LapSet, width: number, height: number, gap: number): StripLayout => {
  const bands = set.bands;
  const first = bands[0];
  const last = bands[bands.length - 1];
  if (!first || !last || last.to <= first.from) return { bars: [], spans: [], hasPartial: false };
  const total = last.to - first.from;
  const byIndex = new Map(set.analysis.map((lap) => [lap.lapIndex, lap]));
  const average = summarizeLaps(set).avgSecPerKm;
  const mid = height / 2;

  const deviationOf = (band: LapBand): number | undefined => {
    const pace = byIndex.get(band.lapIndex)?.paceSecPerKm;
    if (pace === undefined || average === undefined) return undefined;
    return average - pace;
  };
  let maxDeviation = 1;
  for (const band of bands) {
    const deviation = deviationOf(band);
    if (deviation !== undefined) maxDeviation = Math.max(maxDeviation, Math.abs(deviation));
  }

  const bars: StripBar[] = [];
  const spans: StripLayout['spans'] = [];
  let hasPartial = false;
  for (const band of bands) {
    const x = ((band.from - first.from) / total) * width;
    const span = ((band.to - band.from) / total) * width;
    spans.push({ lapIndex: band.lapIndex, x, width: span });
    let barGap = 0.3;
    if (span > 3) barGap = gap;
    const barX = x + barGap / 2;
    const barWidth = Math.max(0.6, span - barGap);
    const isPartial = byIndex.get(band.lapIndex)?.isPartial === true;
    if (isPartial) hasPartial = true;
    let opacity = 0.9;
    if (isPartial) opacity = 0.35;
    const deviation = deviationOf(band);
    if (deviation === undefined) {
      bars.push({
        lapIndex: band.lapIndex,
        x: barX,
        width: barWidth,
        y: mid - 0.6,
        height: 1.2,
        fill: 'rgba(255,255,255,.3)',
        opacity: 1,
      });
      continue;
    }
    const barHeight = Math.max(1.2, (Math.abs(deviation) / maxDeviation) * (mid - 1));
    let y = mid;
    let fill: string = SLOWER;
    if (deviation >= 0) {
      y = mid - barHeight;
      fill = FASTER;
    }
    bars.push({
      lapIndex: band.lapIndex,
      x: barX,
      width: barWidth,
      y,
      height: barHeight,
      fill,
      opacity,
    });
  }
  return { bars, spans, hasPartial };
};

const Bars = (props: { bars: StripBar[] }) =>
  props.bars.map((bar) => (
    <rect
      key={bar.lapIndex}
      x={bar.x}
      y={bar.y}
      width={bar.width}
      height={bar.height}
      fill={bar.fill}
      fillOpacity={bar.opacity}
    />
  ));

const AVATAR_SIZE = 30;

const AvatarFrame = (props: { children: ReactNode }) => (
  <svg
    width={AVATAR_SIZE}
    height={AVATAR_SIZE}
    viewBox="0 0 30 30"
    aria-hidden="true"
    data-testid="lap-strip-avatar"
  >
    <rect width="30" height="30" rx="6" fill="rgba(255,255,255,.04)" />
    {props.children}
  </svg>
);

const LapStripAvatar = (props: { set: LapSet | null }) => {
  if (!props.set || props.set.analysis.length < MIN_SUMMARY_LAPS) {
    return (
      <AvatarFrame>
        <line x1="4" x2="26" y1="15" y2="15" stroke="rgba(255,255,255,.3)" strokeDasharray="2 2" />
      </AvatarFrame>
    );
  }
  const layout = layoutStrip(props.set, 26, 24, 0.8);
  return (
    <AvatarFrame>
      <g transform="translate(2 3)">
        <line x1="0" x2="26" y1="12" y2="12" stroke="rgba(255,255,255,.25)" strokeWidth={0.6} />
        <Bars bars={layout.bars} />
      </g>
    </AvatarFrame>
  );
};

const DETAIL_WIDTH = 400;
const DETAIL_HEIGHT = 64;

const LegendDot = (props: { color: string; opacity?: number; label: string }) => (
  <span className="inline-flex items-center gap-1">
    <i
      className="inline-block size-2 rounded-[2px]"
      style={{ background: props.color, opacity: props.opacity }}
    />
    {props.label}
  </span>
);

const LapStripDetail = (props: { set: LapSet }) => {
  const hovered = useMapFocusStore((s) => s.hoveredLapIndex);
  const selected = useMapFocusStore((s) => s.selectedLapIndex);
  const layout = layoutStrip(props.set, DETAIL_WIDTH, DETAIL_HEIGHT, 2);
  const firstBand = props.set.bands[0];
  const lastBand = props.set.bands[props.set.bands.length - 1];
  const hoveredSpan = layout.spans.find(
    (span) => span.lapIndex === hovered && span.lapIndex !== selected,
  );
  const selectedSpan = layout.spans.find((span) => span.lapIndex === selected);

  return (
    <div className="flex flex-col gap-2" data-testid="lap-strip">
      <div className="flex flex-col gap-0.5">
        <svg
          viewBox={`0 0 ${DETAIL_WIDTH} ${DETAIL_HEIGHT}`}
          preserveAspectRatio="none"
          aria-hidden="true"
          className="block h-16 w-full"
          onPointerLeave={() => useMapFocusStore.getState().setHoveredLap(null)}
        >
          <line
            x1="0"
            x2={DETAIL_WIDTH}
            y1={DETAIL_HEIGHT / 2}
            y2={DETAIL_HEIGHT / 2}
            stroke="rgba(255,255,255,.25)"
            strokeDasharray="2 3"
            vectorEffect="non-scaling-stroke"
          />
          <Bars bars={layout.bars} />
          {hoveredSpan && (
            <rect
              x={hoveredSpan.x}
              y={0}
              width={hoveredSpan.width}
              height={DETAIL_HEIGHT}
              fill="#fff"
              fillOpacity={0.1}
            />
          )}
          {selectedSpan && (
            <rect
              data-testid="lap-strip-selected"
              x={selectedSpan.x + 0.75}
              y={0.75}
              width={Math.max(0.5, selectedSpan.width - 1.5)}
              height={DETAIL_HEIGHT - 1.5}
              rx={2}
              fill="#fff"
              fillOpacity={0.06}
              stroke="#fff"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
            />
          )}
          {layout.spans.map((span) => (
            <rect
              key={span.lapIndex}
              data-testid="lap-strip-bar"
              x={span.x}
              y={0}
              width={span.width}
              height={DETAIL_HEIGHT}
              fill="transparent"
              className="cursor-pointer"
              onPointerEnter={() => useMapFocusStore.getState().setHoveredLap(span.lapIndex)}
              onClick={() => useMapFocusStore.getState().toggleSelectedLap(span.lapIndex)}
            />
          ))}
        </svg>
        {firstBand && lastBand && (
          <div className="flex justify-between text-[11px] text-text-quaternary tabular-nums">
            <span>{firstBand.lapIndex + 1}</span>
            <span>{lastBand.lapIndex + 1}</span>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-text-tertiary">
        <LegendDot color={FASTER} label={m.ui_laps_legend_faster()} />
        <LegendDot color={SLOWER} label={m.ui_laps_legend_slower()} />
        {layout.hasPartial && (
          <LegendDot color={FASTER} opacity={0.35} label={m.ui_laps_legend_partial()} />
        )}
      </div>
    </div>
  );
};

export const LapStrip = (props: { set: LapSet | null; size: 'avatar' | 'detail' }) => {
  if (props.size === 'avatar') return <LapStripAvatar set={props.set} />;
  if (!props.set) return null;
  return <LapStripDetail set={props.set} />;
};
