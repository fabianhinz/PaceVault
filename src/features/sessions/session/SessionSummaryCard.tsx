import { glassClass } from '@/components/ui/Card.tsx';
import { cn } from '@/lib/utils.ts';
import type { SessionLap, SessionRecord, TrainingSession } from '@/packages/engine/types.ts';
import { LapsRow } from './LapsRow.tsx';
import { TrainingEffectCard } from './TrainingEffectCard.tsx';
import { WeatherCard } from './WeatherCard.tsx';

interface SessionSummaryCardProps {
  session: TrainingSession;
  records: SessionRecord[];
  laps: SessionLap[];
}

export const SessionSummaryCard = (props: SessionSummaryCardProps) => (
  <div
    data-testid="session-summary"
    className={cn(glassClass, 'divide-y divide-white/10 overflow-hidden rounded-2xl empty:hidden')}
  >
    <WeatherCard session={props.session} records={props.records} />
    <TrainingEffectCard session={props.session} records={props.records} />
    <LapsRow laps={props.laps} sport={props.session.sport} />
  </div>
);
