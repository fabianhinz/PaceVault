import { Activity } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { PageGrid } from '@/components/ui/PageGrid.tsx';
import { ChartPreviewCard } from '@/components/ui/ChartPreviewCard.tsx';
import { List } from '@/components/ui/List.tsx';
import { tokens } from '@/lib/tokens.ts';
import { ZoneColorListItem } from '@/features/sessions/charts/ZoneColorListItem.tsx';
import { ZoneDistributionChart } from '@/features/sessions/charts/ZoneDistributionChart.tsx';
import { useZoneData } from '@/features/sessions/charts/hooks/useZoneData.ts';
import { TrainingEffectCard } from '@/features/sessions/session/TrainingEffectCard.tsx';
import { SessionRecordsCard } from '@/features/sessions/session/SessionRecordsCard.tsx';
import { SessionChartsExplorer } from '@/features/sessions/charts/SessionChartsExplorer.tsx';
import { SessionStatsGrid } from '@/features/sessions/session/SessionStatsGrid.tsx';
import type { TrainingSession, SessionRecord, SessionLap } from '@/packages/engine/types.ts';
import { usePersonalBestsStore } from '@/store/personalBests.ts';

interface OverviewTabProps {
  session: TrainingSession;
  records: SessionRecord[];
  laps: SessionLap[];
}

export const OverviewTab = (props: OverviewTabProps) => {
  const pbs = usePersonalBestsStore((store) => store.pbs);
  const sessionPBs = pbs.filter((pb) => pb.sessionId === props.session.id);
  const isRunning = props.session.sport === 'running';
  const zoneData = useZoneData(props.records, isRunning);

  return (
    <PageGrid>
      <div className="lg:col-span-2">
        <TrainingEffectCard records={props.records} session={props.session} />
      </div>

      <ChartPreviewCard
        title={m.ui_chart_title_zones()}
        icon={Activity}
        color={tokens.accent}
        compactHeight="h-[250px]"
        footer={
          <List>
            <ZoneColorListItem availableModes={zoneData.availableModes} />
          </List>
        }
      >
        {(mode) => (
          <ZoneDistributionChart
            hrZones={zoneData.hrZoneData}
            powerZones={zoneData.powerZoneData}
            paceZones={zoneData.paceZoneData}
            mode={mode}
          />
        )}
      </ChartPreviewCard>

      {sessionPBs.length > 0 && (
        <div className="lg:col-span-2">
          <SessionRecordsCard sessionPBs={sessionPBs} />
        </div>
      )}

      <div className="lg:col-span-2">
        <SessionChartsExplorer records={props.records} session={props.session} />
      </div>

      <div className="lg:col-span-2">
        <SessionStatsGrid session={props.session} laps={props.laps} />
      </div>
    </PageGrid>
  );
};
