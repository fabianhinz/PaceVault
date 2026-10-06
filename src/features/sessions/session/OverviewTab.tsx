import { PageGrid } from '@/components/ui/PageGrid.tsx';
import { TrainingEffectCard } from '@/features/sessions/session/TrainingEffectCard.tsx';
import { SessionChartsExplorer } from '@/features/sessions/charts/SessionChartsExplorer.tsx';
import { SessionStatsGrid } from '@/features/sessions/session/SessionStatsGrid.tsx';
import type { TrainingSession, SessionRecord, SessionLap } from '@/packages/engine/types.ts';

interface OverviewTabProps {
  session: TrainingSession;
  records: SessionRecord[];
  laps: SessionLap[];
}

export const OverviewTab = (props: OverviewTabProps) => {
  return (
    <PageGrid>
      <div className="lg:col-span-2">
        <TrainingEffectCard records={props.records} session={props.session} />
      </div>

      <div className="lg:col-span-2">
        <SessionChartsExplorer records={props.records} session={props.session} />
      </div>

      <div className="lg:col-span-2">
        <SessionStatsGrid session={props.session} laps={props.laps} />
      </div>
    </PageGrid>
  );
};
