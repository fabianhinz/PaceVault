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
        'scroll-fade flex min-h-0 shrink flex-col gap-4 overflow-y-auto overscroll-contain px-5 pt-2 pb-5',
        props.className,
      )}
    >
      {props.children}
    </div>
  );
};
