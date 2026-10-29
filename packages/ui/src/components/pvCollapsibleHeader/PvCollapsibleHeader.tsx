import type { FC, ReactNode, Ref } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../lib/cn.ts';

interface PvCollapsibleHeaderProps {
  open: boolean;
  onClick: () => void;
  trailing?: ReactNode;
  className?: string;
  children: ReactNode;
  ref?: Ref<HTMLButtonElement>;
}

export const PvCollapsibleHeader: FC<PvCollapsibleHeaderProps> = (props) => (
  <button
    ref={props.ref}
    type="button"
    aria-expanded={props.open}
    onClick={props.onClick}
    className={cn(
      'group flex w-full cursor-pointer items-center gap-2 text-left',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
      props.className,
    )}
  >
    {props.children}
    <span className="inline-flex shrink-0 items-center gap-1 rounded-lg p-1.5 text-text-secondary transition-colors group-hover:bg-white/10 group-hover:text-text-primary">
      {props.trailing}
      <ChevronRight
        aria-hidden
        className={cn('size-4 transition-transform', props.open && 'rotate-90')}
      />
    </span>
  </button>
);
