import type { FC, ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';
import { GLASS_CLASS } from '../../lib/surfaces.ts';

interface PvChartsCardProps {
  zoomReset: ReactNode;
  children: ReactNode;
}

export const PvChartsCard: FC<PvChartsCardProps> = (props) => (
  <div className="relative isolate overflow-clip rounded-2xl">
    <div aria-hidden className={cn(GLASS_CLASS, 'absolute inset-0 z-behind rounded-[inherit]')} />
    {props.zoomReset}
    <div className="divide-y divide-white/10">{props.children}</div>
  </div>
);
