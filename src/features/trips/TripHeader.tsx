import { m } from '@/paraglide/messages.js';
import { useSessionsStore } from '@/store/sessions.ts';
import { Typography } from '@/components/ui/Typography.tsx';
import { formatDistance, formatDuration } from '@/lib/formatters.ts';
import type { Trip } from '@/store/trips.ts';
import type { TrainingSession } from '@/packages/engine/types.ts';

/**
 * Shared trip header: name (primary) + a stats line (secondary) of session
 * count, total distance and total time. Used by the trip list (tabs) and the
 * manage dialog so both read identically — no ellipsis menu here.
 */
export const TripHeader = (props: { trip: Trip }) => {
  const sessions = useSessionsStore((s) => s.sessions);

  const tripSessions = props.trip.sessionIds
    .map((id) => sessions.find((s) => s.id === id))
    .filter((s): s is TrainingSession => Boolean(s));

  const count = tripSessions.length;
  const stats: string[] = [
    count === 1 ? m.ui_count_sessions_one() : m.ui_count_sessions_other({ count: String(count) }),
  ];
  if (count > 0) {
    stats.push(formatDistance(tripSessions.reduce((sum, s) => sum + s.distance, 0)));
    stats.push(formatDuration(tripSessions.reduce((sum, s) => sum + s.duration, 0)));
  }

  return (
    <div className="min-w-0 flex-1">
      <Typography variant="subtitle1" noWrap>
        {props.trip.name}
      </Typography>
      {props.trip.description && (
        <Typography variant="caption" as="p" color="textTertiary" noWrap>
          {props.trip.description}
        </Typography>
      )}
      <Typography variant="caption" as="p" color="textSecondary">
        {stats.join(' · ')}
      </Typography>
    </div>
  );
};
