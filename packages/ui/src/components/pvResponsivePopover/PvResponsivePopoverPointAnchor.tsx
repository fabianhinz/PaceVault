import { useMemo, type FC } from 'react';
import { PvPopoverAnchor } from '../pvPopover/PvPopoverAnchor.tsx';

interface PvResponsivePopoverPointAnchorProps {
  x: number;
  y: number;
}

export const PvResponsivePopoverPointAnchor: FC<PvResponsivePopoverPointAnchorProps> = (props) => {
  const virtualRef = useMemo(
    () => ({
      current: {
        getBoundingClientRect: () =>
          DOMRect.fromRect({ x: props.x, y: props.y, width: 0, height: 0 }),
      },
    }),
    [props.x, props.y],
  );
  return <PvPopoverAnchor virtualRef={virtualRef} />;
};
