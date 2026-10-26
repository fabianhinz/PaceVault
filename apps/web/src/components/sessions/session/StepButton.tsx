import type { FC, ReactNode } from 'react';
import { cn } from '@pacevault/ui/lib/cn.ts';

interface StepButtonProps {
  label: string;
  testId: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}

export const StepButton: FC<StepButtonProps> = (props) => (
  <button
    type="button"
    aria-label={props.label}
    data-testid={props.testId}
    disabled={props.disabled}
    onClick={props.onClick}
    className={cn(
      'group -my-px inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full',
      'text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none',
      'disabled:cursor-default disabled:opacity-30',
    )}
  >
    <span
      className={cn(
        'inline-flex size-9 items-center justify-center rounded-full transition-colors',
        'group-hover:bg-white/10 group-disabled:bg-transparent',
        'group-focus-visible:ring-2 group-focus-visible:ring-accent',
      )}
    >
      {props.children}
    </span>
  </button>
);
