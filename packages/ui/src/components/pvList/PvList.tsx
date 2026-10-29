import type { FC, ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';

interface PvListProps {
  children: ReactNode;
  className?: string;
}

export const PvList: FC<PvListProps> = (props) => (
  <ul className={cn('space-y-3', props.className)}>{props.children}</ul>
);
