import type { ElementType, ReactNode } from 'react';
import { m } from '@/paraglide/messages.js';
import { Typography } from '@/components/ui/Typography.tsx';
import type { TypographyVariants } from '@/components/ui/Typography.tsx';
import { formatDistance, formatDuration } from '@/lib/formatters.ts';
import type { Trip } from '@/store/trips.ts';
import { TripBadge } from './TripBadge.tsx';
import { useTripSessions } from './hooks/useTripSessions.ts';
import { computeTripTotals } from './tripStats.ts';

/**
 * Shared trip header: name (primary) + optional description + a stats line
 * (secondary) of session count, total distance and total time. Used by the
 * trip list, the manage dialog and the trip detail page. Pass `children` to
 * render an actions slot (e.g. the actions menu) beside the title.
 */
export const TripHeader = (props: {
  trip: Trip;
  titleVariant?: TypographyVariants;
  titleAs?: ElementType;
  children?: ReactNode;
}) => {
  const tripSessions = useTripSessions(props.trip);
  const totals = computeTripTotals(tripSessions);

  const stats: string[] = [
    totals.count === 1
      ? m.ui_count_sessions_one()
      : m.ui_count_sessions_other({ count: String(totals.count) }),
  ];
  if (totals.count > 0) {
    stats.push(formatDistance(totals.distance));
    stats.push(formatDuration(totals.duration));
  }

  return (
    <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <TripBadge />
        <div className="min-w-0">
          <Typography variant={props.titleVariant ?? 'subtitle1'} as={props.titleAs} noWrap>
            {props.trip.name}
          </Typography>
          <Typography variant="caption" as="p" color="textSecondary">
            {stats.join(' · ')}
          </Typography>
        </div>
      </div>
      {props.children}
    </div>
  );
};
