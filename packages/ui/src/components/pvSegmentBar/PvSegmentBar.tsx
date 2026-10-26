import type { FC } from 'react';
import type { TokenColor } from '../../lib/tokens.ts';

interface SegmentBarSegment {
  key: string;
  value: number;
  className?: string;
  color?: TokenColor;
}

interface PvSegmentBarProps {
  segments: SegmentBarSegment[];
}

export const PvSegmentBar: FC<PvSegmentBarProps> = (props) => {
  let total = 0;
  for (const segment of props.segments) total += segment.value;

  return (
    <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-white/5">
      {total > 0 &&
        props.segments.map((segment) => (
          <div
            key={segment.key}
            className={segment.className}
            style={{ width: `${(segment.value / total) * 100}%`, backgroundColor: segment.color }}
          />
        ))}
    </div>
  );
};
