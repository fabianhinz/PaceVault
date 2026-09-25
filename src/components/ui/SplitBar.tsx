import { cn } from '@/lib/utils.ts';
import { Typography } from './Typography.tsx';
import { InlineSkeleton } from './InlineSkeleton.tsx';

export interface SplitBarSegment {
  key: string;
  label: string;
  value: number;
  display: string | null;
  colorClass: string;
}

interface SplitBarProps {
  segments: SplitBarSegment[];
}

export const SplitBar = (props: SplitBarProps) => {
  let total = 0;
  for (const segment of props.segments) total += segment.value;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-white/5">
        {total > 0 &&
          props.segments.map((segment) => (
            <div
              key={segment.key}
              className={cn('opacity-70', segment.colorClass)}
              style={{ width: `${(segment.value / total) * 100}%` }}
            />
          ))}
      </div>
      {props.segments.map((segment) => (
        <div key={segment.key} className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={cn('size-2 rounded-full opacity-70', segment.colorClass)} />
            <Typography variant="caption">{segment.label}</Typography>
          </div>
          <div className="flex h-4 items-center">
            {segment.display === null ? (
              <InlineSkeleton />
            ) : (
              <Typography variant="caption" tabularNums>
                {segment.display}
              </Typography>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
