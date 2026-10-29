import type { FC, ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';

interface PvPageGridProps {
  children: ReactNode;
  className?: string;
}

export const PvPageGrid: FC<PvPageGridProps> = (props) => (
  <div className={cn('flex flex-col gap-4', props.className)}>{props.children}</div>
);
