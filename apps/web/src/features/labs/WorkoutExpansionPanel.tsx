import type { FC } from 'react';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { TILE_CLASS } from '@pacevault/ui/lib/surfaces.ts';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { groupSteps } from '@/lib/groupSteps.ts';
import type { RunningZone } from '@pacevault/engine/types.ts';
import type { PrescribedWorkout } from '@/types.ts';
import { StepRow } from '@/features/labs/StepRow.tsx';
import { X } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';

interface WorkoutExpansionPanelProps {
  workout: PrescribedWorkout;
  zones: RunningZone[];
  onClose: () => void;
}

export const WorkoutExpansionPanel: FC<WorkoutExpansionPanelProps> = (props) => {
  return (
    <div className={cn(TILE_CLASS, 'mt-3 p-4 space-y-3')}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <PvTypography variant="body1" color="textPrimary" className="font-medium">
            {props.workout.title}
          </PvTypography>
          <PvTypography variant="caption" color="textSecondary">
            {props.workout.dayLabel} — {props.workout.date}
          </PvTypography>
        </div>
        <PvButton variant="ghost" size="icon" aria-label={m.ui_btn_close()} onClick={props.onClose}>
          <X size={16} />
        </PvButton>
      </div>

      {props.workout.steps.length > 0 && (
        <div className="space-y-2">
          {groupSteps(props.workout.steps).map((group, gi) =>
            group.kind === 'single' ? (
              <StepRow key={gi} step={group.step} zones={props.zones} showRepeat />
            ) : (
              <fieldset
                key={gi}
                className="rounded-xl border border-white/10 px-3 pb-3 pt-1 space-y-1"
              >
                <PvTypography variant="caption" color="textSecondary" as="legend" className="px-2">
                  {group.repeat}×
                </PvTypography>
                {group.steps.map((s, si) => (
                  <StepRow key={si} step={s} zones={props.zones} showRepeat={false} />
                ))}
              </fieldset>
            ),
          )}
        </div>
      )}
    </div>
  );
};
