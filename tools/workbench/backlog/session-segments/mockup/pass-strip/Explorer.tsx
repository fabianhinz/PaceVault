import type { FC } from 'react';
import { Crown, Gauge, Heart, Timer, Zap, type LucideIcon } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PvChartRow } from '@pacevault/ui/components/pvChartsCard/PvChartRow.tsx';
import { PvChartsCard } from '@pacevault/ui/components/pvChartsCard/PvChartsCard.tsx';
import { PvStatRail } from '@pacevault/ui/components/pvStatRail/PvStatRail.tsx';
import { fontSizes, tokens, type TokenColor } from '@pacevault/ui/lib/tokens.ts';
import { CHANNELS, averageOf, channelSeries, type Channel, type Pass } from './data.ts';
import { formatPace, formatRaceTime } from './format.ts';

interface ChannelSpec {
  title: string;
  icon: LucideIcon;
  color: TokenColor;
  unit: string;
  reversed: boolean;
  format: (value: number) => string;
}

const SPEC_BY_CHANNEL: Record<Channel, ChannelSpec> = {
  hr: { title: 'Heart rate', icon: Heart, color: tokens.chartHr, unit: 'bpm', reversed: false, format: (value) => String(Math.round(value)) },
  pace: { title: 'Pace', icon: Timer, color: tokens.chartPace, unit: '/km', reversed: true, format: formatPace },
  power: { title: 'Power', icon: Zap, color: tokens.chartPower, unit: 'W', reversed: false, format: (value) => String(Math.round(value)) },
  cadence: { title: 'Cadence', icon: Gauge, color: tokens.chartCadence, unit: 'spm', reversed: false, format: (value) => String(Math.round(value)) },
};

const TICK = { fill: tokens.textTertiary, fontSize: fontSizes['2xs'] };
const Y_AXIS_WIDTH_PX = 36;
const SYNC_ID = 'pass-strip-explorer';

const rowsOf = ({ selected, best }: { selected: Array<{ elapsedSec: number; value: number }>; best: Array<{ elapsedSec: number; value: number }> | undefined }) => {
  const byElapsed = new Map<number, { elapsedSec: number; selected: number | null; best: number | null }>();
  for (const point of selected) byElapsed.set(point.elapsedSec, { elapsedSec: point.elapsedSec, selected: point.value, best: null });
  for (const point of best ?? []) {
    const row = byElapsed.get(point.elapsedSec) ?? { elapsedSec: point.elapsedSec, selected: null, best: null };
    row.best = point.value;
    byElapsed.set(point.elapsedSec, row);
  }
  return [...byElapsed.values()].sort((a, b) => a.elapsedSec - b.elapsedSec);
};

interface ChannelRowProps {
  channel: Channel;
  selected: Pass;
  best: Pass;
}

const ChannelRow: FC<ChannelRowProps> = (props) => {
  const spec = SPEC_BY_CHANNEL[props.channel];
  const paired = props.selected.id !== props.best.id;
  const selectedSeries = channelSeries({ pass: props.selected, channel: props.channel });
  let bestSeries: Array<{ elapsedSec: number; value: number }> | undefined = undefined;
  if (paired) bestSeries = channelSeries({ pass: props.best, channel: props.channel });
  const rows = rowsOf({ selected: selectedSeries, best: bestSeries });
  const domainSec = Math.max(props.selected.durationSec, props.best.durationSec);
  let selectedColor: string = tokens.best;
  if (paired) selectedColor = spec.color;
  const maxValue = Math.max(...selectedSeries.map((point) => point.value));
  let note = undefined;
  if (bestSeries !== undefined)
    note = {
      text: `${spec.format(averageOf(bestSeries))} ${spec.unit}`,
      color: tokens.best,
      icon: <Crown role="img" aria-label="Best" size={12} fill="currentColor" strokeWidth={1.5} />,
    };

  return (
    <PvChartRow
      title={spec.title}
      icon={spec.icon}
      color={spec.color}
      rail={
        <PvStatRail
          header="avg"
          active={false}
          noteSlot
          notePlacement="top"
          note={note}
          rows={[
            {
              key: props.channel,
              value: spec.format(averageOf(selectedSeries)),
              unit: spec.unit,
              secondary: `max ${spec.format(maxValue)}`,
            },
          ]}
        />
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart syncId={SYNC_ID} data={rows}>
          <XAxis
            dataKey="elapsedSec"
            type="number"
            domain={[0, domainSec]}
            ticks={[0, domainSec]}
            tick={TICK}
            tickLine={false}
            axisLine={{ stroke: tokens.border }}
            tickFormatter={(value: number) => formatRaceTime(value)}
          />
          <YAxis
            domain={['auto', 'auto']}
            width={Y_AXIS_WIDTH_PX}
            tick={TICK}
            tickLine={false}
            axisLine={false}
            tickCount={3}
            reversed={spec.reversed}
            tickFormatter={(value: number) => spec.format(value)}
          />
          <Tooltip content={() => null} isAnimationActive={false} />
          {paired && (
            <Line dataKey="best" type="monotone" stroke={tokens.best} strokeWidth={1.5} dot={false} isAnimationActive={false} connectNulls />
          )}
          <Line dataKey="selected" type="monotone" stroke={selectedColor} strokeWidth={1.75} dot={false} isAnimationActive={false} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </PvChartRow>
  );
};

interface ExplorerProps {
  selected: Pass;
  best: Pass;
}

export const Explorer: FC<ExplorerProps> = (props) => (
  <div data-testid="explorer">
    <PvChartsCard zoomReset={null}>
      {CHANNELS.map((channel) => (
        <ChannelRow key={channel} channel={channel} selected={props.selected} best={props.best} />
      ))}
    </PvChartsCard>
  </div>
);
