import type { FC } from 'react';
import { StatusRing } from './StatusRing.tsx';

interface StatusFillProps {
  dash: number;
}

export const StatusFill: FC<StatusFillProps> = (props) => (
  <>
    <StatusRing />
    <circle
      cx="7"
      cy="7"
      r="2.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="5"
      strokeDasharray={`${props.dash} 100`}
      transform="rotate(-90 7 7)"
    />
  </>
);
