import { useMemo, type FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import type { LapSet } from '@/lib/laps.ts';
import { useMapControlsStore } from '@/store/mapControls.ts';
import { useDevice } from '@pacevault/ui/hooks/useDevice.ts';
import { Bars } from './Bars.tsx';
import { LegendDot } from './LegendDot.tsx';
import { FASTER, SLOWER, layoutStrip } from './lapStripLayout.ts';
import { tokens } from '@pacevault/ui/lib/tokens.ts';

const DETAIL_WIDTH = 400;
const DETAIL_HEIGHT = 64;

interface LapStripDetailProps {
  set: LapSet;
}

export const LapStripDetail: FC<LapStripDetailProps> = (props) => {
  const hovered = useMapControlsStore((s) => s.hoveredLapIndex);
  const selected = useMapControlsStore((s) => s.selectedLapIndex);
  const device = useDevice();
  const set = props.set;
  const layout = useMemo(
    () => layoutStrip({ set, width: DETAIL_WIDTH, height: DETAIL_HEIGHT, gap: 2 }),
    [set],
  );
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
          onPointerLeave={
            device.pointerFine
              ? () => useMapControlsStore.getState().setHoveredLap(null)
              : undefined
          }
        >
          <line
            x1="0"
            x2={DETAIL_WIDTH}
            y1={DETAIL_HEIGHT / 2}
            y2={DETAIL_HEIGHT / 2}
            stroke={tokens.white25}
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
              className="fill-white"
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
              className="fill-white stroke-white"
              fillOpacity={0.06}
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
              onPointerEnter={
                device.pointerFine
                  ? () => useMapControlsStore.getState().setHoveredLap(span.lapIndex)
                  : undefined
              }
              onClick={() => useMapControlsStore.getState().toggleSelectedLap(span.lapIndex)}
            />
          ))}
        </svg>
        {firstBand && lastBand && (
          <div className="flex justify-between text-2xs text-text-quaternary tabular-nums">
            <span>{firstBand.lapIndex + 1}</span>
            <span>{lastBand.lapIndex + 1}</span>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-text-tertiary">
        <LegendDot color={FASTER} label={m.ui_laps_legend_faster()} />
        <LegendDot color={SLOWER} label={m.ui_laps_legend_slower()} />
        {layout.partialPresent && (
          <LegendDot color={FASTER} opacity={0.35} label={m.ui_laps_legend_partial()} />
        )}
      </div>
    </div>
  );
};
