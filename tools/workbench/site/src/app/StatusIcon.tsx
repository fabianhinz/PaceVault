import type { FC, ReactNode } from 'react';
import { cn } from '@pacevault/ui/lib/cn.ts';
import type { Bucket } from '@site/lib/vocabulary.ts';
import { StatusFill } from './StatusFill.tsx';
import { StatusRing } from './StatusRing.tsx';

const SHAPE_BY_BUCKET: Record<Bucket, () => ReactNode> = {
  'needs-you': () => (
    <circle
      cx="7"
      cy="7"
      r="6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeDasharray="1.4 1.75"
    />
  ),
  idea: () => <StatusRing />,
  exploring: () => <StatusFill dash={3.14} />,
  planned: () => <StatusFill dash={6.28} />,
  ready: () => <StatusFill dash={9.42} />,
  'in-dev': () => <StatusFill dash={12.57} />,
  'in-review': () => <StatusFill dash={15.71} />,
  done: () => <circle cx="7" cy="7" r="6.75" fill="currentColor" />,
};

interface StatusIconProps {
  bucket: Bucket;
  className?: string;
}

export const StatusIcon: FC<StatusIconProps> = (props) => (
  <svg viewBox="0 0 14 14" aria-hidden="true" className={cn('size-3.5 shrink-0', props.className)}>
    {SHAPE_BY_BUCKET[props.bucket]()}
  </svg>
);
