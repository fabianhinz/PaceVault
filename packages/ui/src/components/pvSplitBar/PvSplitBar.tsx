import type { FC } from 'react';
import { cn } from '../../lib/cn.ts';
import { PvTypography } from '../pvTypography/PvTypography.tsx';
import { PvInlineSkeleton } from '../pvInlineSkeleton/PvInlineSkeleton.tsx';
import { PvSegmentBar } from '../pvSegmentBar/PvSegmentBar.tsx';
import type { SplitBarSegment } from './types.ts';

interface PvSplitBarProps {
  segments: SplitBarSegment[];
}

export const PvSplitBar: FC<PvSplitBarProps> = (props) => {
  return (
    <div className="flex flex-col gap-2">
      <PvSegmentBar
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
            <PvTypography variant="caption">{segment.label}</PvTypography>
          </div>
          <div className="flex h-4 items-center">
            {segment.display === null ? (
              <PvInlineSkeleton />
            ) : (
              <PvTypography variant="caption" tabularNums>
                {segment.display}
              </PvTypography>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
