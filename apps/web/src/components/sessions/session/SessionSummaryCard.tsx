import type { FC } from 'react';
import { GLASS_CLASS } from '@pacevault/ui/lib/surfaces.ts';
import { cn } from '@pacevault/ui/lib/cn.ts';
import type { SessionLap, SessionRecord, TrainingSession } from '@pacevault/engine/types.ts';
import { LapsRow } from './LapsRow.tsx';
import { MoreStatsRow } from './MoreStatsRow.tsx';
import { TrainingEffectCard } from './TrainingEffectCard.tsx';
import { WeatherCard } from './WeatherCard.tsx';

interface SessionSummaryCardProps {
  session: TrainingSession;
  records: SessionRecord[];
  laps: SessionLap[];
}

export const SessionSummaryCard: FC<SessionSummaryCardProps> = (props) => (
  <div
    data-testid="session-summary"
    className={cn(GLASS_CLASS, 'divide-y divide-white/10 overflow-hidden rounded-2xl empty:hidden')}
  >
    <WeatherCard session={props.session} records={props.records} />
    <TrainingEffectCard session={props.session} records={props.records} />
    <LapsRow laps={props.laps} sport={props.session.sport} />
    <MoreStatsRow session={props.session} records={props.records} />
  </div>
);
