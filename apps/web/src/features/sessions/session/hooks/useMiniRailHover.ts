import { useState, type PointerEvent } from 'react';
import type { MiniRailProps, MiniRailSegmentProps } from '@/features/sessions/session/types.ts';

interface MiniRailHover {
  index: number | null;
  railProps: MiniRailProps;
  segmentProps: (segment: number) => MiniRailSegmentProps;
}

export const useMiniRailHover = (): MiniRailHover => {
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  const railProps: MiniRailProps = {
    onPointerLeave: (event: PointerEvent<HTMLElement>) => {
      if (event.pointerType === 'mouse') setHovered(null);
    },
  };

  const segmentProps = (segment: number): MiniRailSegmentProps => ({
    onPointerEnter: (event: PointerEvent<HTMLElement>) => {
      if (event.pointerType === 'mouse') setHovered(segment);
    },
    onClick: () => {
      setHovered(null);
      setSelected((current) => {
        if (current === segment) return null;
        return segment;
      });
    },
  });

  return { index: hovered ?? selected, railProps, segmentProps };
};
