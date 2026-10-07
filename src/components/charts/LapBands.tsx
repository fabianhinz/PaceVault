import { useMemo } from 'react';
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
  isActive: boolean;
  isAlternate: boolean;
  isHovered: boolean;
  isSelected: boolean;
}

const stripFill = (props: LapBandShapeProps): string => {
  if (props.isSelected) return 'rgba(255,255,255,.95)';
  if (props.isHovered) return 'rgba(255,255,255,.6)';
  if (!props.isActive) return 'rgba(255,255,255,.1)';
  if (props.isAlternate) return 'rgba(255,255,255,.22)';
  return 'rgba(255,255,255,.32)';
};

const LapBandShape = (props: LapBandShapeProps) => {
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
      {props.isHovered && !props.isSelected && (
        <rect x={x} y={y} width={width} height={height} fill="rgba(255,255,255,.1)" />
      )}
      {props.isSelected && (
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
        fill={stripFill(props)}
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
  const sessionLaps = useMapFocusStore((s) => s.sessionLaps);
  const selected = useMapFocusStore((s) => s.selectedLapIndex);
  const hovered = useMapFocusStore((s) => s.hoveredLapIndex);
  const rows = props.rows;
  const xKey = props.xKey;

  const bands = useMemo(() => {
    if (!sessionLaps) return [];
    return bandsOnRows(
      sessionLaps.bands,
      rows.map((row) => row[xKey]),
    );
  }, [sessionLaps, rows, xKey]);

  const activeByIndex = useMemo(() => {
    const map = new Map<number, boolean>();
    for (const lap of sessionLaps?.analysis ?? []) {
      map.set(lap.lapIndex, lap.intensity === 'active');
    }
    return map;
  }, [sessionLaps]);

  return bands.map((band) => (
    <ReferenceArea
      key={band.lapIndex}
      yAxisId={props.yAxisId}
      x1={band.from}
      x2={band.to}
      ifOverflow="visible"
      shape={(shapeProps: AreaShapeProps) => (
        <LapBandShape
          x={shapeProps.x}
          y={shapeProps.y}
          width={shapeProps.width}
          height={shapeProps.height}
          isActive={activeByIndex.get(band.lapIndex) ?? true}
          isAlternate={band.lapIndex % 2 === 1}
          isHovered={hovered === band.lapIndex}
          isSelected={selected === band.lapIndex}
        />
      )}
    />
  ));
};
