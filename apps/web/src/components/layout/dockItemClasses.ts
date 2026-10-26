import { cn } from '@pacevault/ui/lib/cn.ts';
import { FLOATING_CLASS } from '@pacevault/ui/lib/surfaces.ts';

export const itemClasses: Record<'rail' | 'pill' | 'circle', string> = {
  rail: 'size-10',
  pill: 'h-11 min-w-0 flex-1',
  circle: 'size-11',
};

export const itemClass = 'relative shrink-0 rounded-full text-text-tertiary';

export const activeItemClass =
  'bg-accent-muted text-accent-hover hover:bg-accent-muted hover:text-accent-hover';

export const segmentClass = cn(FLOATING_CLASS, 'flex rounded-full');
