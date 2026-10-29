import type { FC, ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';

interface PvCollapsibleContentProps {
  open: boolean;
  children: ReactNode;
}

export const PvCollapsibleContent: FC<PvCollapsibleContentProps> = (props) => (
  <div
    inert={!props.open}
    className={cn(
      'grid transition-[grid-template-rows] duration-250 ease-out',
      props.open && 'grid-rows-[1fr]',
      !props.open && 'grid-rows-[0fr]',
    )}
  >
    <div className="min-h-0 overflow-hidden">{props.children}</div>
  </div>
);
