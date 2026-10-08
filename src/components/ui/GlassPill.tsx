import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils.ts';
import { glassClass } from './Card.tsx';

export const glassPillClass = `${glassClass} pointer-events-auto inline-flex shrink-0 items-center rounded-full text-sm whitespace-nowrap text-text-primary`;

export const GlassPill = (props: ComponentProps<'button'>) => (
  <button
    type="button"
    {...props}
    className={cn(
      glassPillClass,
      'cursor-pointer gap-2 px-3 py-2 transition-colors hover:bg-white/10',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
      props.className,
    )}
  />
);
