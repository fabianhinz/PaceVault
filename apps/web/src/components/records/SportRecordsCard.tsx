import type { FC } from 'react';
import { PageLink } from '@/routing/PageLink.tsx';
import { PvCard } from '@pacevault/ui/components/pvCard/PvCard.tsx';
import { PvCardHeader } from '@pacevault/ui/components/pvCardHeader/PvCardHeader.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { PvValueSkeleton } from '@pacevault/ui/components/pvValueSkeleton/PvValueSkeleton.tsx';
import { SportBadge } from '@/components/sessions/SportBadge.tsx';
import { pbLabel, formatPBValue, formatDate } from '@/lib/format/formatters.ts';
import { PB_SLOTS_BY_SPORT } from '@/lib/analysis/records.ts';
import type { PersonalBest, Sport } from '@pacevault/engine/types.ts';
import { LABEL_BY_SPORT, RECORDS_SUBTITLE_BY_SPORT } from '@/microcopy/sports.ts';

interface SportRecordsCardProps {
  sport: Sport;
  pbs: PersonalBest[] | undefined;
  loading: boolean;
}

export const SportRecordsCard: FC<SportRecordsCardProps> = (props) => {
  const slots = PB_SLOTS_BY_SPORT[props.sport];

  return (
    <PvCard>
      <PvCardHeader
        icon={<SportBadge sport={props.sport} />}
        titleSlot={<PvTypography>{LABEL_BY_SPORT[props.sport]()}</PvTypography>}
        subtitle={RECORDS_SUBTITLE_BY_SPORT[props.sport]()}
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
              className={`flex items-center gap-3 rounded-lg px-3 py-2${pb ? ' transition-colors hover:bg-white/10' : ''}`}
            >
              <div className="flex-1 min-w-0">
                <PvTypography variant="body1" color={pb ? 'textPrimary' : 'textSecondary'}>
                  {label}
                </PvTypography>
              </div>
              {props.loading ? (
                <div className="text-right">
                  <PvValueSkeleton />
                </div>
              ) : (
                <div className="text-right">
                  <PvTypography variant="subtitle1" color={pb ? 'textPrimary' : 'textTertiary'}>
                    {pb ? formatPBValue(pb) : '--'}
                  </PvTypography>
                  <PvTypography variant="caption" as="p" className={pb ? '' : 'invisible'}>
                    {pb ? formatDate(pb.date) : '\u00a0'}
                  </PvTypography>
                </div>
              )}
            </div>
          );

          if (pb) {
            return (
              <PageLink
                key={`${slot.category}-${slot.window}`}
                to={{ page: 'sessionDetail', params: { sessionId: pb.sessionId } }}
                className="block"
              >
                {row}
              </PageLink>
            );
          }

          return <div key={`${slot.category}-${slot.window}`}>{row}</div>;
        })}
      </div>
    </PvCard>
  );
};
