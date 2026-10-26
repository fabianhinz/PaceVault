import type { FC } from 'react';
import type { StripBar } from './lapStripLayout.ts';

interface BarsProps {
  bars: StripBar[];
}

export const Bars: FC<BarsProps> = (props) =>
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
