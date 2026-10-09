import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils.ts';
import { type HighlightTrack, highlightRect, trackLengthCss } from '@/lib/slidingHighlight.ts';

interface SlidingHighlightProps {
  track: HighlightTrack;
  axis: 'x' | 'y';
  index: number;
  className?: string;
}

const placement = (props: SlidingHighlightProps): CSSProperties => {
  const rect = highlightRect(props.track, Math.max(props.index, 0));
  if (props.axis === 'x') {
    return {
      left: trackLengthCss(rect.offset),
      width: trackLengthCss(rect.size),
      top: props.track.padding,
      bottom: props.track.padding,
    };
  }
  return {
    top: trackLengthCss(rect.offset),
    height: trackLengthCss(rect.size),
    left: props.track.padding,
    right: props.track.padding,
  };
};

export const SlidingHighlight = (props: SlidingHighlightProps) => (
  <span
    aria-hidden
    data-sliding-highlight
    style={placement(props)}
    className={cn(
      'pointer-events-none absolute rounded-full bg-accent-muted',
      'transition-[top,left,opacity] duration-250 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
      props.index < 0 && 'opacity-0',
      props.className,
    )}
  />
);
