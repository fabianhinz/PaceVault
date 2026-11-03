import { useMemo, type FC } from 'react';
import { ArrowUpDown, Bike, Crown, Footprints, Gauge, Heart, Mountain, Timer, TrendingUp, Zap, type LucideIcon } from 'lucide-react';
import { Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import { PvChartRow } from '@pacevault/ui/components/pvChartsCard/PvChartRow.tsx';
import { PvChartsCard } from '@pacevault/ui/components/pvChartsCard/PvChartsCard.tsx';
import { PvStatRail } from '@pacevault/ui/components/pvStatRail/PvStatRail.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { tokens, type TokenColor } from '@pacevault/ui/lib/tokens.ts';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { FLOATING_PILL_CLASS } from '@pacevault/ui/lib/surfaces.ts';
import type { Copy, Lang } from './copy.ts';
import type { Channel, Pass, Segment } from './data.ts';
import { chartTime, date, integer, MISSING, oneDecimal, pace, signedOneDecimal } from './format.ts';
import { setHover, useExplorerSeconds } from './hoverStore.ts';
import { Sized } from './Sized.tsx';
import { BEST_PALETTE } from './bestPalette.ts';
import { EdgeTick } from './EdgeTick.tsx';

const GRID_POINTS = 160;
const SYNC_ID = 'segment-explorer';
const TICK = { fill: tokens.textTertiary, fontSize: 11 };
const Y_AXIS_WIDTH = 36;
const renderNothing = () => null;
const HOVER_ONLY_TOOLTIP = { content: renderNothing, isAnimationActive: false } as const;

interface ChannelSpec {
  icon: LucideIcon;
  color: TokenColor;
  unit: string;
  reversed: boolean;
  format: (lang: Lang, value: number | null) => string;
  rest: (input: { pass: Pass; segment: Segment; text: Copy; lang: Lang }) => { header: string; value: string; secondary: string };
}

interface RowPoint {
  t: number;
  selected: number | null;
  best: number | null;
}

const present = (values: Array<number | null> | null) => (values ?? []).filter((v): v is number => v !== null);

const mean = (values: number[]) => {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
};

const extreme = ({ values, pick }: { values: number[]; pick: 'max' | 'min' }) => {
  if (values.length === 0) return null;
  if (pick === 'max') return Math.max(...values);
  return Math.min(...values);
};

const elevationChange = (values: number[]) => {
  let gain = 0;
  let loss = 0;
  for (let i = 1; i < values.length; i++) {
    const step = (values[i] ?? 0) - (values[i - 1] ?? 0);
    if (step > 0) gain += step;
    if (step < 0) loss -= step;
  }
  return { gain, loss };
};

const avgMax = ({ channel, format }: { channel: Channel; format: (lang: Lang, value: number | null) => string }) =>
  (input: { pass: Pass; text: Copy; lang: Lang }) => {
    const values = present(input.pass.series[channel]);
    return {
      header: input.text.railAvg,
      value: format(input.lang, mean(values)),
      secondary: `${input.text.railMax} ${format(input.lang, extreme({ values, pick: 'max' }))}`,
    };
  };

const intFormat = (_lang: Lang, value: number | null) => integer(value);
const paceFormat = (_lang: Lang, value: number | null) => pace(value);

const SPEC_BY_CHANNEL: Record<Channel, ChannelSpec> = {
  hr: { icon: Heart, color: tokens.chartHr, unit: 'bpm', reversed: false, format: intFormat, rest: avgMax({ channel: 'hr', format: intFormat }) },
  power: { icon: Zap, color: tokens.chartPower, unit: 'W', reversed: false, format: intFormat, rest: avgMax({ channel: 'power', format: intFormat }) },
  speed: {
    icon: Gauge,
    color: tokens.chartSpeed,
    unit: 'km/h',
    reversed: false,
    format: oneDecimal,
    rest: (input) => ({
      header: input.text.railAvg,
      value: oneDecimal(input.lang, (input.segment.distanceMeters / input.pass.seconds) * 3.6),
      secondary: `${input.text.railMax} ${oneDecimal(input.lang, extreme({ values: present(input.pass.series.speed), pick: 'max' }))}`,
    }),
  },
  pace: {
    icon: Timer,
    color: tokens.chartPace,
    unit: '/km',
    reversed: true,
    format: paceFormat,
    rest: (input) => ({
      header: input.text.railAvg,
      value: pace(input.pass.seconds / (input.segment.distanceMeters / 1000)),
      secondary: `${input.text.railBest} ${pace(extreme({ values: present(input.pass.series.pace), pick: 'min' }))}`,
    }),
  },
  gap: {
    icon: ArrowUpDown,
    color: tokens.chartGap,
    unit: '/km',
    reversed: true,
    format: paceFormat,
    rest: (input) => ({ header: input.text.railAvg, value: pace(mean(present(input.pass.series.gap))), secondary: '' }),
  },
  elevation: {
    icon: Mountain,
    color: tokens.chartElevation,
    unit: 'm',
    reversed: false,
    format: intFormat,
    rest: (input) => {
      const change = elevationChange(present(input.pass.series.elevation));
      return { header: '', value: `+${Math.round(change.gain)}`, secondary: `−${Math.round(change.loss)} m` };
    },
  },
  grade: {
    icon: TrendingUp,
    color: tokens.chartGrade,
    unit: '%',
    reversed: false,
    format: signedOneDecimal,
    rest: (input) => ({
      header: input.text.railAvg,
      value: signedOneDecimal(input.lang, (input.segment.netElevationMeters / input.segment.distanceMeters) * 100),
      secondary: `${input.text.railMax} ${signedOneDecimal(input.lang, extreme({ values: present(input.pass.series.grade), pick: 'max' }))}`,
    }),
  },
  cadence: { icon: Footprints, color: tokens.chartCadence, unit: 'spm', reversed: false, format: intFormat, rest: avgMax({ channel: 'cadence', format: intFormat }) },
};

const CHANNEL_ORDER: Channel[] = ['hr', 'power', 'speed', 'pace', 'gap', 'elevation', 'grade', 'cadence'];

const interpolated = ({ pass, channel, seconds }: { pass: Pass; channel: Channel; seconds: number }): number | null => {
  const values = pass.series[channel];
  const t = pass.series.t;
  if (values === null || seconds > pass.seconds || t.length === 0) return null;
  if (seconds <= (t[0] ?? 0)) return values[0] ?? null;
  for (let i = 0; i < t.length - 1; i++) {
    const from = t[i] ?? 0;
    const to = t[i + 1] ?? 0;
    if (seconds < from || seconds > to) continue;
    const a = values[i] ?? null;
    const b = values[i + 1] ?? null;
    if (a === null || b === null) return null;
    if (to === from) return a;
    return a + ((b - a) * (seconds - from)) / (to - from);
  }
  return values[values.length - 1] ?? null;
};

const rowData = ({ selected, best, channel, domain }: { selected: Pass; best: Pass | undefined; channel: Channel; domain: number }): RowPoint[] =>
  Array.from({ length: GRID_POINTS }, (_, i) => {
    const seconds = Math.round((i / (GRID_POINTS - 1)) * domain);
    let bestValue: number | null = null;
    if (best !== undefined) bestValue = interpolated({ pass: best, channel, seconds });
    return { t: seconds, selected: interpolated({ pass: selected, channel, seconds }), best: bestValue };
  });

interface RailProps {
  channel: Channel;
  pass: Pass;
  best: Pass | undefined;
  segment: Segment;
  text: Copy;
  lang: Lang;
}

const ChannelRail: FC<RailProps> = (props) => {
  const seconds = useExplorerSeconds();
  const spec = SPEC_BY_CHANNEL[props.channel];
  const rest = spec.rest({ pass: props.pass, segment: props.segment, text: props.text, lang: props.lang });
  let header = rest.header;
  let value = rest.value;
  let secondary = rest.secondary;
  let active = false;
  if (seconds !== null) {
    active = true;
    header = chartTime(seconds);
    value = MISSING;
    if (seconds <= props.pass.seconds) value = spec.format(props.lang, interpolated({ pass: props.pass, channel: props.channel, seconds }));
    secondary = rest.header === '' ? rest.value : `${rest.header} ${rest.value}`;
  }
  let unit = spec.unit;
  if (props.channel === 'cadence' && props.segment.sport === 'cycling') unit = 'rpm';
  let bestValue: string | undefined = undefined;
  if (seconds !== null && props.best !== undefined) bestValue = `${spec.format(props.lang, interpolated({ pass: props.best, channel: props.channel, seconds }))} ${unit}`;
  return (
    <div className="relative h-full">
      <PvStatRail header={header} active={active} noteSlot secondarySlot rows={[{ key: 'value', value, unit, secondary }]} />
      {bestValue !== undefined && (
        <span data-testid="rail-best-note" className="pointer-events-none absolute right-2 bottom-0 left-0 flex h-8 items-start gap-1">
          <Crown role="img" aria-label={props.text.best} size={12} fill="currentColor" strokeWidth={1.5} className="mt-0.5 shrink-0" style={{ color: BEST_PALETTE.crown }} />
          <PvTypography variant="caption" tabularNums noWrap style={{ color: BEST_PALETTE.text }}>
            {bestValue}
          </PvTypography>
        </span>
      )}
    </div>
  );
};

interface ChannelChartProps {
  data: RowPoint[];
  channel: Channel;
  domain: number;
  sportColor: string;
  pair: boolean;
}

const ChannelChart: FC<ChannelChartProps> = (props) => {
  const spec = SPEC_BY_CHANNEL[props.channel];
  return (
    <Sized>
        {(size) => (
      <LineChart
          width={size.width}
          height={size.height}
        syncId={SYNC_ID}
        data={props.data}
        onMouseMove={(event) => {
          if (event.activeLabel !== undefined && event.activeLabel !== null) setHover({ kind: 'explorer', seconds: Number(event.activeLabel) });
        }}
        onMouseLeave={() => setHover(null)}
      >
        <XAxis
          dataKey="t"
          type="number"
          domain={[0, props.domain]}
          ticks={[0, props.domain]}
          tick={<EdgeTick first={0} format={chartTime} />}
          tickLine={false}
          axisLine={{ stroke: tokens.border }}
          tickMargin={4}
          interval={0}
        />
        <YAxis domain={['auto', 'auto']} width={Y_AXIS_WIDTH} tick={TICK} tickLine={false} axisLine={false} reversed={spec.reversed} tickCount={3} tickFormatter={(value: number) => spec.format('en', value)} />
        <Tooltip {...HOVER_ONLY_TOOLTIP} />
        {props.pair && <Line dataKey="best" type="monotone" stroke={BEST_PALETTE.line} strokeWidth={1.5} dot={false} isAnimationActive={false} />}
        <Line dataKey="selected" type="monotone" stroke={props.pair ? props.sportColor : BEST_PALETTE.line} strokeWidth={1.75} dot={false} isAnimationActive={false} />
      </LineChart>
    )}
      </Sized>
  );
};

interface LegendProps {
  selected: Pass;
  pair: boolean;
  sportColor: string;
  lang: Lang;
  text: Copy;
}

const LegendEntry: FC<{ color: string; label: string }> = (props) => (
  <span className="flex min-w-0 items-center gap-1.5">
    <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: props.color }} />
    <PvTypography variant="caption" color="textSecondary" tabularNums noWrap>
      {props.label}
    </PvTypography>
  </span>
);

const LegendPill: FC<LegendProps> = (props) => {
  return (
    <div className="pointer-events-none sticky top-3 z-raised flex h-0 items-start justify-end">
      <span data-testid="explorer-legend" className={cn(FLOATING_PILL_CLASS, 'pointer-events-none mt-3 mr-3 gap-3 px-3 py-2')}>
        {props.pair && <LegendEntry color={props.sportColor} label={date(props.lang, props.selected.date)} />}
        <LegendEntry color={BEST_PALETTE.line} label={props.text.best} />
      </span>
    </div>
  );
};

interface SegmentExplorerProps {
  segment: Segment;
  selected: Pass;
  best: Pass;
  sportColor: string;
  lang: Lang;
  text: Copy;
}

export const SegmentExplorer: FC<SegmentExplorerProps> = (props) => {
  const pair = props.selected.sessionId !== props.best.sessionId;
  let comparedBest: Pass | undefined = undefined;
  if (pair) comparedBest = props.best;
  const domain = Math.max(props.selected.seconds, comparedBest?.seconds ?? 0);
  const channels = CHANNEL_ORDER.filter((channel) => present(props.selected.series[channel]).length > 0 || present(comparedBest?.series[channel] ?? null).length > 0);
  const rows = useMemo(
    () => channels.map((channel) => ({ channel, data: rowData({ selected: props.selected, best: comparedBest, channel, domain }) })),
    [props.selected, comparedBest, domain, channels.join(',')],
  );
  return (
    <div data-testid="segment-explorer">
      <PvChartsCard zoomReset={<LegendPill selected={props.selected} pair={pair} sportColor={props.sportColor} lang={props.lang} text={props.text} />}>
        {rows.map((row) => {
          let icon = SPEC_BY_CHANNEL[row.channel].icon;
          if (row.channel === 'cadence' && props.segment.sport === 'cycling') icon = Bike;
          return (
            <PvChartRow
              key={row.channel}
              title={props.text.channel(row.channel)}
              icon={icon}
              color={SPEC_BY_CHANNEL[row.channel].color}
              rail={<ChannelRail channel={row.channel} pass={props.selected} best={comparedBest} segment={props.segment} text={props.text} lang={props.lang} />}
            >
              <ChannelChart data={row.data} channel={row.channel} domain={domain} sportColor={props.sportColor} pair={pair} />
            </PvChartRow>
          );
        })}
      </PvChartsCard>
    </div>
  );
};
