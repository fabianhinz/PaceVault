import { useRef, type FC, type ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';
import { useScrollFadeEffect } from '../../hooks/useScrollFadeEffect.ts';
import { useScrollToEndEffect } from '../../hooks/useScrollToEndEffect.ts';

interface PvPlotStripProps {
  label: string;
  scrollKey: string;
  children: ReactNode;
  pinned?: ReactNode;
  className?: string;
}

export const PvPlotStrip: FC<PvPlotStripProps> = (props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  useScrollFadeEffect(scrollRef, { axis: 'x' });
  useScrollToEndEffect({ ref: scrollRef, scrollKey: props.scrollKey });
  return (
    <div role="group" aria-label={props.label} className={cn('flex gap-1', props.className)}>
      {props.pinned}
      <div
        ref={scrollRef}
        data-testid="plot-strip"
        className="scroll-fade-x min-w-0 [--fade-solid-top:var(--spacing-4)] flex-1 overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:none]"
      >
        <div className="flex w-max min-w-full justify-end gap-1">{props.children}</div>
      </div>
    </div>
  );
};
