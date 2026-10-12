import { cn } from '@/lib/utils.ts';
import { Typography } from './Typography.tsx';
import { InlineSkeleton } from './InlineSkeleton.tsx';
import { SegmentBar } from './SegmentBar.tsx';

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
  return (
    <div className="flex flex-col gap-2">
      <SegmentBar
        segments={props.segments.map((segment) => ({
          key: segment.key,
          value: segment.value,
          className: cn('opacity-70', segment.colorClass),
        }))}
      />
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
