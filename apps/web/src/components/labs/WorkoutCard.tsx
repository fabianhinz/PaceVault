import type { FC } from 'react';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { formatDuration } from '@/lib/format/formatters.ts';
import { ICON_BY_WORKOUT_TYPE } from './workoutDisplay.ts';
import type { PrescribedWorkout } from '@/types.ts';

interface WorkoutCardProps {
  workout: PrescribedWorkout;
  expanded: boolean;
  onToggle: () => void;
}

export const WorkoutCard: FC<WorkoutCardProps> = (props) => {
  const restDay = props.workout.type === 'rest';
  const Icon = ICON_BY_WORKOUT_TYPE[props.workout.type];

  return (
    <div
      className={cn(
        'relative flex flex-col items-center gap-1.5 p-3 rounded-xl flex-1 min-w-5rem transition-colors border',
        restDay ? 'opacity-50 bg-white/5' : 'bg-white/5 hover:bg-white/10 cursor-pointer',
        props.expanded ? 'border-accent' : 'border-white/10',
      )}
      onClick={restDay ? undefined : props.onToggle}
    >
      <PvTypography variant="caption">{props.workout.dayLabel.slice(0, 3)}</PvTypography>

      <Icon size={20} className="text-text-secondary" />

      <PvTypography
        variant="caption"
        color="textSecondary"
        className="text-center leading-tight min-h-[2em]"
      >
        {props.workout.title}
      </PvTypography>

      {!restDay && (
        <div className="flex gap-2 mt-auto">
          <PvTypography variant="caption" color="textTertiary">
            {formatDuration(props.workout.estimatedDurationSec)}
          </PvTypography>
          <PvTypography variant="caption" color="textTertiary">
            {props.workout.estimatedTss}T
          </PvTypography>
        </div>
      )}
    </div>
  );
};
