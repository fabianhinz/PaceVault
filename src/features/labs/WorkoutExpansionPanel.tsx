import { Typography } from '@/components/ui/Typography.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { PaceRange } from '@/components/ui/PaceRange.tsx';
import { formatDuration } from '@/lib/formatters.ts';
import { groupSteps } from '@/lib/groupSteps.ts';
import { STEP_LABELS } from './workoutDisplay.ts';
import type { RunningZone } from '@/packages/engine/types.ts';
import type { PrescribedWorkout, WorkoutStep } from '@/types/index.ts';
import { X } from 'lucide-react';
import { m } from '@/paraglide/messages.js';

export const WorkoutExpansionPanel = (props: {
  workout: PrescribedWorkout;
  zones: RunningZone[];
  onClose: () => void;
}) => {
  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <Typography variant="body1" color="textPrimary" className="font-medium">
            {props.workout.title}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {props.workout.dayLabel} — {props.workout.date}
          </Typography>
        </div>
        <Button variant="ghost" size="icon" aria-label={m.ui_btn_close()} onClick={props.onClose}>
          <X size={16} />
        </Button>
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
                <Typography variant="caption" color="textSecondary" as="legend" className="px-2">
                  {group.repeat}×
                </Typography>
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

const StepRow = (props: { step: WorkoutStep; zones: RunningZone[]; showRepeat: boolean }) => {
  const zone = props.zones.find((z) => z.name === props.step.zone);
  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-white/5">
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: zone?.color ?? '#888' }}
      />
      <Typography variant="caption" color="textSecondary" className="w-16 shrink-0">
        {STEP_LABELS[props.step.type]?.() ?? props.step.type}
      </Typography>
      <Typography variant="caption" color="textSecondary" className="grow-1 text-right">
        {formatDuration(props.step.durationSec)} &middot;{' '}
        <PaceRange minPace={props.step.targetPaceMin} maxPace={props.step.targetPaceMax} />
      </Typography>
    </div>
  );
};
