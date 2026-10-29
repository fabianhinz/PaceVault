import { useRef, type FC, type ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';
import { useScrollFadeEffect } from '../../hooks/useScrollFadeEffect.ts';

interface PvDialogBodyProps {
  className?: string;
  children: ReactNode;
}

export const PvDialogBody: FC<PvDialogBodyProps> = (props) => {
  const ref = useRef<HTMLDivElement>(null);
  useScrollFadeEffect(ref);
  return (
    <div
      ref={ref}
      className={cn(
        'scroll-fade min-h-0 shrink overflow-y-auto overscroll-contain px-5 pt-1 pb-5',
        'lg:-mx-1 lg:px-1 lg:pt-0 lg:pb-1',
        props.className,
      )}
    >
      {props.children}
    </div>
  );
};
