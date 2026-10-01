import type { ElementType, ReactNode } from 'react';
import { Typography } from '@/components/ui/Typography.tsx';
import type { TypographyVariants } from '@/components/ui/Typography.tsx';
import type { Trip } from '@/store/trips.ts';
import { TripBadge } from './TripBadge.tsx';
import { useTripSessions } from './hooks/useTripSessions.ts';
import { computeTripTotals, formatTripStatsLine } from './tripStats.ts';

export const TripHeader = (props: {
  trip: Trip;
  titleVariant?: TypographyVariants;
  titleAs?: ElementType;
  children?: ReactNode;
}) => {
  const tripSessions = useTripSessions(props.trip);
  const statsLine = formatTripStatsLine(computeTripTotals(tripSessions));

  return (
    <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <TripBadge />
        <div className="min-w-0">
          <Typography variant={props.titleVariant ?? 'subtitle1'} as={props.titleAs} noWrap>
            {props.trip.name}
          </Typography>
          <Typography variant="caption" as="p" color="textSecondary">
            {statsLine}
          </Typography>
        </div>
      </div>
      {props.children}
    </div>
  );
};
