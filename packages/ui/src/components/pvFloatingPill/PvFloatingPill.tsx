import type { ComponentProps, FC } from 'react';
import { cn } from '../../lib/cn.ts';
import { FLOATING_PILL_CLASS } from '../../lib/surfaces.ts';

export const PvFloatingPill: FC<ComponentProps<'button'>> = (props) => (
  <button
    type="button"
    {...props}
    className={cn(
      FLOATING_PILL_CLASS,
      'relative isolate cursor-pointer gap-2 px-3 py-2',
      'before:pointer-events-none before:absolute before:inset-1 before:z-behind before:rounded-full',
      'before:transition-colors hover:before:bg-white/10',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
      props.className,
    )}
  />
);
