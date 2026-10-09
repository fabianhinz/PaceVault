import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils.ts';
import { floatingClass } from './Card.tsx';

export const floatingPillClass = `${floatingClass} pointer-events-auto inline-flex shrink-0 items-center rounded-full text-sm whitespace-nowrap text-text-primary`;

export const FloatingPill = (props: ComponentProps<'button'>) => (
  <button
    type="button"
    {...props}
    className={cn(
      floatingPillClass,
      'cursor-pointer gap-2 px-3 py-2 transition-colors hover:bg-white/10',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
      props.className,
    )}
  />
);
