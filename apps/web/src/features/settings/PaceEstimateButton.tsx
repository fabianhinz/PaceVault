import type { FC } from 'react';
import { Info } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';

interface PaceEstimateButtonProps {
  onClick: () => void;
}

/** The "Estimate from a race time" link that opens `PaceEstimatorDialog`. */
export const PaceEstimateButton: FC<PaceEstimateButtonProps> = (props) => (
  <span className="flex gap-1 align-center text-accent">
    <Info size={16} strokeWidth={1.5} className="shrink-0" />
    <button type="button" className="cursor-pointer hover:underline" onClick={props.onClick}>
      {m.ui_thresholds_estimate_from_race()}
    </button>
  </span>
);
