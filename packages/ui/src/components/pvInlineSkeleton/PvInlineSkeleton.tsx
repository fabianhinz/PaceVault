import type { FC } from 'react';
import { cn } from '../../lib/cn.ts';

interface PvInlineSkeletonProps {
  className?: string;
}

export const PvInlineSkeleton: FC<PvInlineSkeletonProps> = (props) => (
  <span
    className={cn(
      'inline-block h-3 w-12 animate-pulse rounded bg-white/10 align-middle',
      props.className,
    )}
  />
);
