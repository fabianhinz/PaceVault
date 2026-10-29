import type { FC, PropsWithChildren } from 'react';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { FLOATING_CLASS } from '@pacevault/ui/lib/surfaces.ts';

export const DockCircle: FC<PropsWithChildren> = (props) => (
  <div className={cn(FLOATING_CLASS, 'shrink-0 rounded-full p-3px')}>{props.children}</div>
);
