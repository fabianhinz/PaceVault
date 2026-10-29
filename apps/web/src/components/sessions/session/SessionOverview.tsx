import type { FC } from 'react';
import { PvPageGrid } from '@pacevault/ui/components/pvPageGrid/PvPageGrid.tsx';
import { SessionChartsExplorer } from '@/components/sessions/charts/SessionChartsExplorer.tsx';
import { SessionSummaryCard } from '@/components/sessions/session/SessionSummaryCard.tsx';
import type { TrainingSession, SessionRecord, SessionLap } from '@pacevault/engine/types.ts';

interface SessionOverviewProps {
  session: TrainingSession;
  records: SessionRecord[];
  laps: SessionLap[];
}

export const SessionOverview: FC<SessionOverviewProps> = (props) => (
  <PvPageGrid>
    <SessionSummaryCard
      key={props.session.id}
      session={props.session}
      records={props.records}
      laps={props.laps}
    />
    <SessionChartsExplorer records={props.records} session={props.session} />
  </PvPageGrid>
);
