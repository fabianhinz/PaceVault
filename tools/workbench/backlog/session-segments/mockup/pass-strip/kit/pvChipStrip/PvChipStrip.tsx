import { useRef, type FC, type ReactNode } from 'react';
import { useScrollFadeEffect } from '@pacevault/ui/hooks/useScrollFadeEffect.ts';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { useScrollToEndEffect } from '../hooks/useScrollToEndEffect.ts';

interface PvChipStripProps {
  label: string;
  scrollKey: string;
  children: ReactNode;
  className?: string;
}

export const PvChipStrip: FC<PvChipStripProps> = (props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  useScrollFadeEffect(scrollRef, { axis: 'x' });
  useScrollToEndEffect(scrollRef, props.scrollKey);
  return (
    <div
      ref={scrollRef}
      role="group"
      aria-label={props.label}
      data-testid="chip-strip"
      className={cn('scroll-fade-x flex gap-0.5 overflow-x-auto overscroll-x-contain [scrollbar-width:none]', props.className)}
    >
      {props.children}
    </div>
  );
};
