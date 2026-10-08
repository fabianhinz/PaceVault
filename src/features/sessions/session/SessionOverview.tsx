import { PageGrid } from '@/components/ui/PageGrid.tsx';
import { SessionChartsExplorer } from '@/features/sessions/charts/SessionChartsExplorer.tsx';
import { SessionSummaryCard } from '@/features/sessions/session/SessionSummaryCard.tsx';
import type { TrainingSession, SessionRecord, SessionLap } from '@/packages/engine/types.ts';

interface SessionOverviewProps {
  session: TrainingSession;
  records: SessionRecord[];
  laps: SessionLap[];
}

export const SessionOverview = (props: SessionOverviewProps) => (
  <PageGrid>
    <SessionSummaryCard
      key={props.session.id}
      session={props.session}
      records={props.records}
      laps={props.laps}
    />
    <SessionChartsExplorer records={props.records} session={props.session} />
  </PageGrid>
);
