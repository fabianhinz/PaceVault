import type { FC, ReactNode } from 'react';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { segmentClass } from '@/components/layout/dockItemClasses.ts';

interface DockSegmentProps {
  className?: string;
  children: ReactNode;
}

export const DockSegment: FC<DockSegmentProps> = (props) => (
  <div className={cn(segmentClass, props.className)}>{props.children}</div>
);
