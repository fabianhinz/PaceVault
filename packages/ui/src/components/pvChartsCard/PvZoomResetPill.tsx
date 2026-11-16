import type { FC, ReactNode } from 'react';
import { ZoomOut } from 'lucide-react';
import { cn } from '../../lib/cn.ts';
import { PvFloatingPill } from '../pvFloatingPill/PvFloatingPill.tsx';

/** What the pill sticks below while the page scrolls: the page edge, or a sticky floating PvTabsList. */
type ZoomResetPillPinning = 'page' | 'belowFloatingTabs';

const STICKY_TOP_BY_PINNING: Record<ZoomResetPillPinning, string> = {
  page: 'top-3',
  belowFloatingTabs: 'top-90px',
};

interface PvZoomResetPillProps {
  zoomed: boolean;
  label: string;
  onReset: () => void;
  pinning?: ZoomResetPillPinning;
  children?: ReactNode;
}

export const PvZoomResetPill: FC<PvZoomResetPillProps> = (props) => {
  if (!props.zoomed) return null;
  return (
    <div
      className={cn(
        'pointer-events-none sticky z-raised hidden h-0 items-start justify-end gap-2 lg:flex',
        STICKY_TOP_BY_PINNING[props.pinning ?? 'page'],
      )}
    >
      <div className="mt-3 mr-3 flex items-center gap-2">
        {props.children}
        <PvFloatingPill data-testid="zoom-reset-chip" onClick={props.onReset}>
          <ZoomOut size={16} />
          <span>{props.label}</span>
        </PvFloatingPill>
      </div>
    </div>
  );
};
