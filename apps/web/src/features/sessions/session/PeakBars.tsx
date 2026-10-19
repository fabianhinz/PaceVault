import { PEAK_WINDOW_SECONDS, peakScale } from '@/lib/moreStats.ts';
import { cn } from '@pacevault/ui/lib/cn.ts';
import type { Sport } from '@pacevault/engine/types.ts';
import { m } from '@pacevault/i18n/messages.js';
import type { MiniRailProps, MiniRailSegmentProps } from './hooks/useMiniRailHover.ts';
import { peakWindow, watts } from './statFormat.ts';

const BAR_CLASS: Record<Sport, { soft: string; strong: string }> = {
  running: { soft: 'bg-sport-running/35', strong: 'bg-sport-running/95' },
  cycling: { soft: 'bg-sport-cycling/35', strong: 'bg-sport-cycling/95' },
};

interface PeakBarsProps {
  sport: Sport;
  watts: Array<number | undefined>;
  highlight: number;
  railProps: MiniRailProps;
  segmentProps: (segment: number) => MiniRailSegmentProps;
}

export const PeakBars = (props: PeakBarsProps) => {
  const heights = peakScale(props.watts, 100);
  const colors = BAR_CLASS[props.sport];
  return (
    <div className="flex h-full w-full items-end gap-1" {...props.railProps}>
      {heights.map((height, i) => {
        const seconds = PEAK_WINDOW_SECONDS[i] ?? i;
        const value = props.watts[i];
        if (height === undefined || value === undefined) {
          return <span key={seconds} aria-hidden className="block h-full flex-1" />;
        }
        return (
          <span
            key={seconds}
            role="img"
            aria-label={m.ui_more_stats_peak_aria({
              window: peakWindow(seconds),
              watts: watts(value),
            })}
            className="flex h-full flex-1 cursor-pointer items-end"
            {...props.segmentProps(i)}
          >
            <span
              className={cn(
                'block w-full rounded-sm',
                i === props.highlight && colors.strong,
                i !== props.highlight && colors.soft,
              )}
              style={{ height: `${height}%` }}
            />
          </span>
        );
      })}
    </div>
  );
};
