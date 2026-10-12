import { Typography } from '@/components/ui/Typography.tsx';
import { PEAK_WINDOWS, peakScale } from '@/lib/moreStats.ts';
import { cn } from '@/lib/utils.ts';
import type { Sport } from '@/packages/engine/types.ts';

const BAR_HEIGHT_PX = 24;

const BAR_CLASS: Record<Sport, { soft: string; strong: string }> = {
  running: { soft: 'bg-sport-running/35', strong: 'bg-sport-running/95' },
  cycling: { soft: 'bg-sport-cycling/35', strong: 'bg-sport-cycling/95' },
};

interface PeakBarsProps {
  sport: Sport;
  watts: Array<number | undefined>;
  highlight: number;
  ftp: number | undefined;
}

export const PeakBars = (props: PeakBarsProps) => {
  const scale = peakScale(props.watts, props.ftp, BAR_HEIGHT_PX);
  const colors = BAR_CLASS[props.sport];
  return (
    <div className="relative flex h-6 w-full items-end gap-1">
      {scale.bars.map((height, i) => {
        const key = PEAK_WINDOWS[i]?.label ?? i;
        if (height === undefined) return <span key={key} className="block flex-1" />;
        return (
          <span
            key={key}
            className={cn(
              'block flex-1 rounded-sm',
              i === props.highlight && colors.strong,
              i !== props.highlight && colors.soft,
            )}
            style={{ height: `${height}px` }}
          />
        );
      })}
      {scale.ftpLine !== undefined && (
        <div
          className="pointer-events-none absolute inset-x-0 border-t border-dashed border-white/30"
          style={{ bottom: `${scale.ftpLine}px` }}
        />
      )}
    </div>
  );
};

export const PeakAxis = () => (
  <div className="flex h-4 w-full gap-1">
    {PEAK_WINDOWS.map((window) => (
      <Typography
        key={window.label}
        variant="caption"
        color="textTertiary"
        className="flex-1 text-center"
      >
        {window.label}
      </Typography>
    ))}
  </div>
);
