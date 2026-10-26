import type { FC } from 'react';
import { useMapControlsStore } from '@/store/mapControls.ts';
import type { AreaShapeProps } from '@/components/charts/types.ts';
import { tokens } from '@pacevault/ui/lib/tokens.ts';

const STRIP_OFFSET = 3;
const STRIP_HEIGHT = 4;

interface StripFillState {
  active: boolean;
  alternate: boolean;
  hovered: boolean;
  selected: boolean;
}

const stripFill = (state: StripFillState): string => {
  if (state.selected) return tokens.white95;
  if (state.hovered) return tokens.white60;
  if (!state.active) return tokens.white10;
  if (state.alternate) return tokens.white22;
  return tokens.white32;
};

interface LapBandShapeProps extends AreaShapeProps {
  lapIndex: number;
  active: boolean;
}

export const LapBandShape: FC<LapBandShapeProps> = (props) => {
  const hovered = useMapControlsStore((s) => s.hoveredLapIndex === props.lapIndex);
  const selected = useMapControlsStore((s) => s.selectedLapIndex === props.lapIndex);
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
      {hovered && !selected && (
        <rect x={x} y={y} width={width} height={height} fill={tokens.white10} />
      )}
      {selected && (
        <rect
          data-testid="lap-band-selected"
          x={x}
          y={y + 0.75}
          width={width}
          height={Math.max(0, height - 1.5)}
          rx={2}
          className="fill-white stroke-white"
          fillOpacity={0.06}
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
          active: props.active,
          alternate: props.lapIndex % 2 === 1,
          hovered,
          selected,
        })}
      />
    </g>
  );
};
