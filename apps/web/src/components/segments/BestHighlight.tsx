import type { FC } from 'react';
import type { ActionItemSize } from '@pacevault/ui/components/pvActionItem/PvActionItem.tsx';
import { BestCrown } from './BestCrown.tsx';

interface BestHighlightProps {
  size?: ActionItemSize;
}

export const BestHighlight: FC<BestHighlightProps> = (props) => (
  <>
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 rounded-[inherit] bg-best/3"
    />
    <BestCrown size={props.size} />
  </>
);
