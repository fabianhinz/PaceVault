import type { FC } from 'react';
import { formatPace } from '@/lib/format/formatters.ts';

interface PaceRangeProps {
  minPace: number;
  maxPace: number;
}

export const PaceRange: FC<PaceRangeProps> = (props) => {
  return (
    <span className="text-text-quaternary">
      {formatPace(props.maxPace)} – {formatPace(props.minPace)}
    </span>
  );
};
