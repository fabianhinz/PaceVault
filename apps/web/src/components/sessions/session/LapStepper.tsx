import type { FC } from 'react';
import { useKeyPressEvent } from 'react-use';
import { ChevronLeft, ChevronRight, Flag, X } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import { PvFloatingPill } from '@pacevault/ui/components/pvFloatingPill/PvFloatingPill.tsx';
import { FLOATING_PILL_CLASS } from '@pacevault/ui/lib/surfaces.ts';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { stepLap, type LapSet, type LapSource } from '@/lib/analysis/laps.ts';
import { useMapControlsStore } from '@/store/mapControls.ts';
import type { Sport } from '@pacevault/engine/types.ts';
import { lapName } from './lapLabels.ts';
import { StepButton } from './StepButton.tsx';

interface LapStepperProps {
  set: LapSet;
  lapIndex: number;
  source: LapSource;
  sport: Sport;
}

export const LapStepper: FC<LapStepperProps> = (props) => {
  useKeyPressEvent('Escape', () => useMapControlsStore.getState().closeSelectedLap());

  const lap = props.set.analysis.find((candidate) => candidate.lapIndex === props.lapIndex);
  const previous = stepLap({ bands: props.set.bands, lapIndex: props.lapIndex, direction: -1 });
  const next = stepLap({ bands: props.set.bands, lapIndex: props.lapIndex, direction: 1 });

  return (
    <>
      <div
        role="group"
        aria-label={m.ui_laps()}
        data-testid="lap-stepper"
        className={cn(FLOATING_PILL_CLASS, 'h-11 gap-0 pr-0 pl-3')}
      >
        <Flag size={16} className="mr-1 shrink-0" />
        <StepButton
          label={m.ui_lap_prev()}
          testId="lap-stepper-prev"
          disabled={previous === undefined}
          onClick={() => {
            if (previous !== undefined) useMapControlsStore.getState().selectLap(previous);
          }}
        >
          <ChevronLeft size={16} />
        </StepButton>
        <span
          data-testid="lap-stepper-name"
          className={cn(
            'w-104px text-center tabular-nums',
            lap && lap.intensity !== 'active' && 'text-text-tertiary',
          )}
        >
          {lapName({
            set: props.set,
            lapIndex: props.lapIndex,
            source: props.source,
            sport: props.sport,
          })}
        </span>
        <StepButton
          label={m.ui_lap_next()}
          testId="lap-stepper-next"
          disabled={next === undefined}
          onClick={() => {
            if (next !== undefined) useMapControlsStore.getState().selectLap(next);
          }}
        >
          <ChevronRight size={16} />
        </StepButton>
      </div>
      <PvFloatingPill
        aria-label={m.ui_lap_clear()}
        data-testid="lap-stepper-clear"
        className="ml-1 size-11 justify-center p-0 text-text-secondary"
        onClick={() => useMapControlsStore.getState().closeSelectedLap()}
      >
        <X size={16} />
      </PvFloatingPill>
    </>
  );
};
