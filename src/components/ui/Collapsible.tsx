import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils.ts';

interface CollapsibleHeaderProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  open: boolean;
  trailing?: ReactNode;
  ref?: Ref<HTMLButtonElement>;
}

export const CollapsibleHeader = (props: CollapsibleHeaderProps) => {
  const { open, trailing, className, children, ref, ...rest } = props;
  return (
    <button
      ref={ref}
      type="button"
      aria-expanded={open}
      className={cn(
        'group flex w-full cursor-pointer items-center gap-2 text-left',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        className,
      )}
      {...rest}
    >
      {children}
      <span className="inline-flex shrink-0 items-center gap-1 rounded-lg p-1.5 text-text-secondary transition-colors group-hover:bg-white/10 group-hover:text-text-primary">
        {trailing}
        <ChevronRight
          aria-hidden
          className={cn('size-4 transition-transform', open && 'rotate-90')}
        />
      </span>
    </button>
  );
};

interface CollapsibleContentProps {
  open: boolean;
  className?: string;
  children: ReactNode;
}

export const CollapsibleContent = (props: CollapsibleContentProps) => (
  <div
    inert={!props.open}
    className={cn(
      'grid transition-[grid-template-rows] duration-250 ease-out',
      props.open && 'grid-rows-[1fr]',
      !props.open && 'grid-rows-[0fr]',
    )}
  >
    <div className={cn('min-h-0 overflow-hidden', props.className)}>{props.children}</div>
  </div>
);
