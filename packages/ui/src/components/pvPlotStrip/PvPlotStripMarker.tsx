import type { FC } from 'react';
import { Triangle, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn.ts';
import { plotStripTopPx } from './plotStripScale.ts';
import type { PlotStripPosition } from './types.ts';

const MARKER_CLASS = 'absolute left-1/2 -translate-x-1/2 -translate-y-1/2';

interface PvPlotStripMarkerProps {
  position: PlotStripPosition;
  icon?: LucideIcon;
}

export const PvPlotStripMarker: FC<PvPlotStripMarkerProps> = (props) => {
  const style = { top: plotStripTopPx(props.position.ratio) };
  const Icon = props.icon;
  if (Icon !== undefined)
    return (
      <Icon
        aria-hidden
        data-marker="icon"
        size={14}
        fill="currentColor"
        strokeWidth={1.5}
        className={cn(MARKER_CLASS, 'text-best')}
        style={style}
      />
    );
  if (props.position.clamped)
    return (
      <Triangle
        aria-hidden
        data-marker="outlier"
        size={8}
        fill="currentColor"
        strokeWidth={0}
        className={cn(MARKER_CLASS, 'rotate-180 text-text-secondary')}
        style={style}
      />
    );
  return (
    <span
      aria-hidden
      data-marker="dot"
      className={cn(MARKER_CLASS, 'size-1.5 rounded-full bg-text-secondary')}
      style={style}
    />
  );
};
