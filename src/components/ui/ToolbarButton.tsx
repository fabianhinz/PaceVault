import type { ReactNode } from 'react';
import { cn } from '@/lib/utils.ts';

export const toolbarButtonClass =
  'flex-1 inline-flex items-center justify-center rounded-lg px-3 py-2.5 text-sm font-medium text-text-tertiary transition-colors cursor-pointer hover:bg-white/10 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

interface ToolbarButtonProps {
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  testId?: string;
  className?: string;
  children: ReactNode;
}

export const ToolbarButton = (props: ToolbarButtonProps) => (
  <button
    type="button"
    data-testid={props.testId}
    disabled={props.disabled}
    onClick={props.onClick}
    className={cn(
      toolbarButtonClass,
      props.active && 'bg-white/10 text-text-primary',
      props.disabled && 'pointer-events-none',
      props.className,
    )}
  >
    <span className={cn('inline-flex items-center gap-2', props.disabled && 'opacity-40')}>
      {props.children}
    </span>
  </button>
);
