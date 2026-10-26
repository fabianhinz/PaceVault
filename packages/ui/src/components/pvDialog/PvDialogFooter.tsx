import type { FC, ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';

interface PvDialogFooterProps {
  className?: string;
  children: ReactNode;
}

export const PvDialogFooter: FC<PvDialogFooterProps> = (props) => (
  <div
    className={cn(
      'grid shrink-0 grid-cols-2 gap-2 px-5 pt-1 pb-5 max-lg:[&>*]:w-full',
      'lg:mt-4 lg:flex lg:justify-end lg:gap-2 lg:p-0',
      props.className,
    )}
  >
    {props.children}
  </div>
);
