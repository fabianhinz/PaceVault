import { useDeferredValue, useMemo } from 'react';
import { ReferenceArea } from 'recharts';
import { bandsOnRows } from '@/lib/lapRanges.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';

export const LAP_STRIP_TICK_MARGIN = 12;

const STRIP_OFFSET = 3;
const STRIP_HEIGHT = 4;

interface AreaShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

interface LapBandShapeProps extends AreaShapeProps {
  lapIndex: number;
  isActive: boolean;
}

interface StripFillState {
  isActive: boolean;
  isAlternate: boolean;
  isHovered: boolean;
  isSelected: boolean;
}

const stripFill = (state: StripFillState): string => {
  if (state.isSelected) return 'rgba(255,255,255,.95)';
  if (state.isHovered) return 'rgba(255,255,255,.6)';
  if (!state.isActive) return 'rgba(255,255,255,.1)';
  if (state.isAlternate) return 'rgba(255,255,255,.22)';
  return 'rgba(255,255,255,.32)';
};

const LapBandShape = (props: LapBandShapeProps) => {
  const isHovered = useMapFocusStore((s) => s.hoveredLapIndex === props.lapIndex);
  const isSelected = useMapFocusStore((s) => s.selectedLapIndex === props.lapIndex);
  if (props.x === undefined || props.y === undefined) return null;
  if (props.width === undefined || props.height === undefined) return null;
  const x = props.x;
  const y = props.y;
  const width = Math.max(0.5, props.width);
  const height = props.height;
  let gap = 0.3;
  if (width > 3) gap = 1;
  return (
    <g data-testid="lap-band">
      {isHovered && !isSelected && (
        <rect x={x} y={y} width={width} height={height} fill="rgba(255,255,255,.1)" />
      )}
      {isSelected && (
        <rect
          data-testid="lap-band-selected"
          x={x}
          y={y + 0.75}
          width={width}
          height={Math.max(0, height - 1.5)}
          rx={2}
          fill="#fff"
          fillOpacity={0.06}
          stroke="#fff"
          strokeWidth={1.5}
        />
      )}
      <rect
        x={x + gap / 2}
        y={y + height + STRIP_OFFSET}
        width={Math.max(0.4, width - gap)}
        height={STRIP_HEIGHT}
        rx={1}
        fill={stripFill({
          isActive: props.isActive,
          isAlternate: props.lapIndex % 2 === 1,
          isHovered,
          isSelected,
        })}
      />
    </g>
  );
};

interface LapBandsProps<K extends string, T extends Record<K, number>> {
  rows: readonly T[];
  xKey: K;
  yAxisId: string;
}

export const LapBands = <K extends string, T extends Record<K, number>>(
  props: LapBandsProps<K, T>,
) => {
  const sessionLaps = useDeferredValue(useMapFocusStore((s) => s.sessionLaps));
  const rows = props.rows;
  const xKey = props.xKey;
  const yAxisId = props.yAxisId;

  return useMemo(() => {
    if (!sessionLaps) return [];
    const activeByIndex = new Map<number, boolean>();
    for (const lap of sessionLaps.analysis) {
      activeByIndex.set(lap.lapIndex, lap.intensity === 'active');
    }
    const bands = bandsOnRows(
      sessionLaps.bands,
      rows.map((row) => row[xKey]),
    );
    return bands.map((band) => (
      <ReferenceArea
        key={band.lapIndex}
        yAxisId={yAxisId}
        x1={band.from}
        x2={band.to}
        ifOverflow="visible"
        shape={(shapeProps: AreaShapeProps) => (
          <LapBandShape
            x={shapeProps.x}
            y={shapeProps.y}
            width={shapeProps.width}
            height={shapeProps.height}
            lapIndex={band.lapIndex}
            isActive={activeByIndex.get(band.lapIndex) ?? true}
          />
        )}
      />
    ));
  }, [sessionLaps, rows, xKey, yAxisId]);
};
