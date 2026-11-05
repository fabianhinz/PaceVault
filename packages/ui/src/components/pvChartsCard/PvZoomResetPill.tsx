import type { FC, ReactNode } from 'react';
import { ZoomOut } from 'lucide-react';
import { PvFloatingPill } from '../pvFloatingPill/PvFloatingPill.tsx';

interface PvZoomResetPillProps {
  zoomed: boolean;
  label: string;
  onReset: () => void;
  children?: ReactNode;
}

export const PvZoomResetPill: FC<PvZoomResetPillProps> = (props) => {
  if (!props.zoomed) return null;
  return (
    <div className="pointer-events-none sticky top-3 z-raised hidden h-0 items-start justify-end gap-2 lg:flex">
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
