import type { CSSProperties, FC } from 'react';
import { cn } from '../../lib/cn.ts';
import { type HighlightTrack, highlightRect, trackLengthCss } from '../../lib/slidingHighlight.ts';

const placement = (props: PvSlidingHighlightProps): CSSProperties => {
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

type HighlightAxis = 'x' | 'y';

interface PvSlidingHighlightProps {
  track: HighlightTrack;
  axis: HighlightAxis;
  index: number;
  className?: string;
}

export const PvSlidingHighlight: FC<PvSlidingHighlightProps> = (props) => (
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
