import type { FC } from 'react';
import { ZoomOut } from 'lucide-react';
import { PvFloatingPill } from '../pvFloatingPill/PvFloatingPill.tsx';

interface PvZoomResetPillProps {
  zoomed: boolean;
  label: string;
  onReset: () => void;
}

export const PvZoomResetPill: FC<PvZoomResetPillProps> = (props) => {
  if (!props.zoomed) return null;
  return (
    <div className="pointer-events-none sticky top-3 z-raised hidden h-0 items-start justify-end lg:flex">
      <PvFloatingPill data-testid="zoom-reset-chip" className="mt-3 mr-3" onClick={props.onReset}>
        <ZoomOut size={16} />
        <span>{props.label}</span>
      </PvFloatingPill>
    </div>
  );
};
