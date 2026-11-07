import type { FC } from 'react';
import { Crown } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import type { ActionItemSize } from '@pacevault/ui/components/pvActionItem/types.ts';

const CLASS_BY_CROWN_SIZE: Record<ActionItemSize, string> = {
  md: '-top-2.75 left-0.5 size-4.5',
  sm: '-top-2 left-0 size-3.5',
};

const ICON_PX_BY_CROWN_SIZE: Record<ActionItemSize, number> = { md: 18, sm: 14 };

interface BestCrownProps {
  size?: ActionItemSize;
}

export const BestCrown: FC<BestCrownProps> = (props) => {
  const size = props.size ?? 'md';
  return (
    <span
      role="img"
      aria-label={m.ui_segment_best()}
      title={m.ui_segment_best()}
      className={`pointer-events-none absolute z-raised grid -rotate-15 place-items-center text-best drop-shadow-sm ${CLASS_BY_CROWN_SIZE[size]}`}
    >
      <Crown size={ICON_PX_BY_CROWN_SIZE[size]} fill="currentColor" strokeWidth={1.5} aria-hidden />
    </span>
  );
};
