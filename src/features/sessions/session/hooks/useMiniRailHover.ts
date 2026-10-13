import { useState, type PointerEvent } from 'react';

export interface MiniRailSegmentProps {
  onPointerEnter: (event: PointerEvent<HTMLElement>) => void;
  onClick: () => void;
}

export interface MiniRailProps {
  onPointerLeave: (event: PointerEvent<HTMLElement>) => void;
}

export const useMiniRailHover = () => {
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
