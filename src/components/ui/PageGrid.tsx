import type { ReactNode } from 'react';
import { cn } from '@/lib/utils.ts';

interface PageGridProps {
  children: ReactNode;
  className?: string;
}

export const PageGrid = (props: PageGridProps) => (
  <div className={cn('flex flex-col gap-4', props.className)}>{props.children}</div>
);
