import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card.tsx';
import { CardHeader } from '@/components/ui/CardHeader.tsx';
import { Typography } from '@/components/ui/Typography.tsx';
import { ValueSkeleton } from '@/components/ui/ValueSkeleton.tsx';
import { SportBadge } from '@/features/sessions/SportBadge.tsx';
import { pbLabel, formatPBValue, formatDate } from '@/lib/formatters.ts';
import { PB_SLOTS } from '@/lib/records.ts';
import type { PersonalBest, Sport } from '@/packages/engine/types.ts';
import { m } from '@/paraglide/messages.js';

const SPORT_NAMES: Record<Sport, () => string> = {
  running: m.ui_sport_running,
  cycling: m.ui_sport_cycling,
};

const sportSubtitle: Record<Sport, () => string> = {
  running: m.ui_records_running_subtitle,
  cycling: m.ui_records_cycling_subtitle,
};

export const SportRecordsCard = (props: {
  sport: Sport;
  pbs: PersonalBest[] | undefined;
  loading?: boolean;
}) => {
  const slots = PB_SLOTS[props.sport];

  return (
    <Card>
      <CardHeader
        icon={<SportBadge sport={props.sport} />}
        titleSlot={<Typography>{SPORT_NAMES[props.sport]()}</Typography>}
        subtitle={sportSubtitle[props.sport]()}
      />
      <div className="space-y-1">
        {slots.map((slot) => {
          const pb = props.pbs?.find(
            (pb) => pb.category === slot.category && pb.window === slot.window,
          );
          const tempPB = {
            sport: props.sport,
            category: slot.category,
            window: slot.window,
            value: 0,
            sessionId: '',
            date: 0,
          } as PersonalBest;
          const label = pbLabel(tempPB);

          const row = (
            <div
              className={`flex items-center gap-3 rounded-lg px-3 py-2${pb && !props.loading ? ' transition-colors hover:bg-white/10' : ''}`}
            >
              <div className="flex-1 min-w-0">
                <Typography variant="body1" color={pb ? 'textPrimary' : 'textSecondary'}>
                  {label}
                </Typography>
              </div>
              <div className="text-right">
                {props.loading ? (
                  <ValueSkeleton />
                ) : (
                  <>
                    <Typography variant="subtitle1" color={pb ? 'textPrimary' : 'textTertiary'}>
                      {pb ? formatPBValue(pb) : '--'}
                    </Typography>
                    <Typography variant="caption" as="p" className={pb ? '' : 'invisible'}>
                      {pb ? formatDate(pb.date) : '\u00a0'}
                    </Typography>
                  </>
                )}
              </div>
            </div>
          );

          if (pb && !props.loading) {
            return (
              <Link
                key={`${slot.category}-${slot.window}`}
                to={`/sessions/${pb.sessionId}`}
                className="block"
              >
                {row}
              </Link>
            );
          }

          return <div key={`${slot.category}-${slot.window}`}>{row}</div>;
        })}
      </div>
    </Card>
  );
};
