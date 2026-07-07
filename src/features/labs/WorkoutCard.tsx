import { Typography } from '@/components/ui/Typography.tsx';
import { cn } from '@/lib/utils.ts';
import { formatDuration } from '@/lib/formatters.ts';
import { WORKOUT_ICONS } from './workoutDisplay.ts';
import type { PrescribedWorkout } from '@/types/index.ts';

interface WorkoutCardProps {
  workout: PrescribedWorkout;
  isExpanded: boolean;
  onToggle: () => void;
}

export const WorkoutCard = (props: WorkoutCardProps) => {
  const isRest = props.workout.type === 'rest';
  const Icon = WORKOUT_ICONS[props.workout.type];

  return (
    <div
      className={cn(
        'relative flex flex-col items-center gap-1.5 p-3 rounded-xl flex-1 min-w-[5rem] transition-colors border',
        isRest ? 'opacity-50 bg-white/5' : 'bg-white/5 hover:bg-white/10 cursor-pointer',
        props.isExpanded ? 'border-accent' : 'border-white/10',
      )}
      onClick={isRest ? undefined : props.onToggle}
    >
      <Typography variant="caption">{props.workout.dayLabel.slice(0, 3)}</Typography>

      <Icon size={20} className="text-text-secondary" />

      <Typography
        variant="caption"
        color="textSecondary"
        className="text-center leading-tight min-h-[2em]"
      >
        {props.workout.title}
      </Typography>

      {!isRest && (
        <div className="flex gap-2 mt-auto">
          <Typography variant="caption" color="textTertiary">
            {formatDuration(props.workout.estimatedDurationSec)}
          </Typography>
          <Typography variant="caption" color="textTertiary">
            {props.workout.estimatedTss}T
          </Typography>
        </div>
      )}
    </div>
  );
};
