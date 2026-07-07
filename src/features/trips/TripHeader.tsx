import { m } from '@/paraglide/messages.js';
import { Typography } from '@/components/ui/Typography.tsx';
import { formatDistance, formatDuration } from '@/lib/formatters.ts';
import type { Trip } from '@/store/trips.ts';
import { useTripSessions } from './hooks/useTripSessions.ts';

/**
 * Shared trip header: name (primary) + a stats line (secondary) of session
 * count, total distance and total time. Used by the trip list (tabs) and the
 * manage dialog so both read identically — no ellipsis menu here.
 */
export const TripHeader = (props: { trip: Trip }) => {
  const tripSessions = useTripSessions(props.trip);

  const count = tripSessions.length;
  const stats: string[] = [
    count === 1 ? m.ui_count_sessions_one() : m.ui_count_sessions_other({ count: String(count) }),
  ];
  if (count > 0) {
    const totals = tripSessions.reduce(
      (acc, s) => {
        acc.distance += s.distance;
        acc.duration += s.duration;
        return acc;
      },
      { distance: 0, duration: 0 },
    );
    stats.push(formatDistance(totals.distance));
    stats.push(formatDuration(totals.duration));
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
