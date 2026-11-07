import type { FC, ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';

interface PvDialogFooterProps {
  className?: string;
  children: ReactNode;
}

export const PvDialogFooter: FC<PvDialogFooterProps> = (props) => (
  <div
    className={cn(
      'grid shrink-0 grid-cols-2 gap-2 px-5 pb-5 max-lg:[&>*]:w-full',
      'lg:flex lg:justify-end',
      props.className,
    )}
  >
    {props.children}
  </div>
);
