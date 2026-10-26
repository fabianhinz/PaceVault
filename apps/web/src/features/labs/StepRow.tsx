import type { FC } from 'react';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { tokens } from '@pacevault/ui/lib/tokens.ts';
import { PaceRange } from '@/components/PaceRange.tsx';
import { formatDuration } from '@/lib/formatters.ts';
import { COLOR_BY_RUNNING_ZONE } from '@/lib/zoneColors.ts';
import { STEP_LABELS } from '@/features/labs/workoutDisplay.ts';
import type { RunningZone } from '@pacevault/engine/types.ts';
import type { WorkoutStep } from '@/types.ts';

interface StepRowProps {
  step: WorkoutStep;
  zones: RunningZone[];
  showRepeat: boolean;
}

export const StepRow: FC<StepRowProps> = (props) => {
  const zone = props.zones.find((z) => z.name === props.step.zone);
  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-white/5">
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: zone ? COLOR_BY_RUNNING_ZONE[zone.name] : tokens.zoneUnknown }}
      />
      <PvTypography variant="caption" color="textSecondary" className="w-16 shrink-0">
        {STEP_LABELS[props.step.type]?.() ?? props.step.type}
      </PvTypography>
      <PvTypography variant="caption" color="textSecondary" className="grow-1 text-right">
        {formatDuration(props.step.durationSec)} &middot;{' '}
        <PaceRange minPace={props.step.targetPaceMin} maxPace={props.step.targetPaceMax} />
      </PvTypography>
    </div>
  );
};
