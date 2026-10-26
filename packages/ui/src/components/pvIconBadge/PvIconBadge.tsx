import type { FC } from 'react';
import { cn } from '../../lib/cn.ts';

interface PvIconBadgeProps {
  show: boolean;
  children: React.ReactNode;
  className?: string;
}

export const PvIconBadge: FC<PvIconBadgeProps> = (props) => {
  return (
    <span className={cn('relative inline-flex', props.className)}>
      {props.children}
      {props.show && (
        <span
          data-testid="icon-badge"
          className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-accent"
        />
      )}
    </span>
  );
};
