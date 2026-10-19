import type { ComponentProps } from 'react';
import { cn } from '../lib/cn.ts';
import { floatingClass } from './Card.tsx';

export const floatingPillClass = `${floatingClass} pointer-events-auto inline-flex shrink-0 items-center rounded-full text-sm whitespace-nowrap text-text-primary`;

export const FloatingPill = (props: ComponentProps<'button'>) => (
  <button
    type="button"
    {...props}
    className={cn(
      floatingPillClass,
      'relative isolate cursor-pointer gap-2 px-3 py-2',
      'before:pointer-events-none before:absolute before:inset-1 before:-z-10 before:rounded-full',
      'before:transition-colors hover:before:bg-white/10',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
      props.className,
    )}
  />
);
