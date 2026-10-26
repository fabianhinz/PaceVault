import type { FC } from 'react';
import { useRouterParam } from '@/routing/useRouterParam.ts';
import { useRouterQuery } from '@/routing/useRouterQuery.ts';
import { PageLink } from '@/routing/PageLink.tsx';
import { m } from '@pacevault/i18n/messages.js';
import { useCoachPlan } from '@/features/labs/hooks/useCoachPlan.ts';
import { PvPageGrid } from '@pacevault/ui/components/pvPageGrid/PvPageGrid.tsx';
import { PvCard } from '@pacevault/ui/components/pvCard/PvCard.tsx';
import { PvCardHeader } from '@pacevault/ui/components/pvCardHeader/PvCardHeader.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { MetricLabel } from '@/components/MetricLabel.tsx';
import { PvActionPromptCard } from '@pacevault/ui/components/pvActionPromptCard/PvActionPromptCard.tsx';
import { PvTabs } from '@pacevault/ui/components/pvTabs/PvTabs.tsx';
import { PvTabsList } from '@pacevault/ui/components/pvTabs/PvTabsList.tsx';
import { PvTabsTrigger } from '@pacevault/ui/components/pvTabs/PvTabsTrigger.tsx';
import { PvTabsContent } from '@pacevault/ui/components/pvTabs/PvTabsContent.tsx';
import { METRIC_EXPLANATIONS } from '@/lib/explanations.ts';
import { resolveLabsTab } from '@/lib/labsTab.ts';

import { WeeklyPlanTimeline } from '@/features/labs/WeeklyPlanTimeline.tsx';
import { RacePredictor } from '@/features/labs/RacePredictor.tsx';
import { PaceCalculator } from '@/features/labs/PaceCalculator.tsx';
import { Settings } from 'lucide-react';
import { LabsPeek } from '@/features/labs/LabsPeek.tsx';
import { ZoneLegend } from '@/features/sessions/ZoneLegend.tsx';
import { StudioTab } from '@/features/studio/StudioTab.tsx';

export const LabsPage: FC = () => {
  const coach = useCoachPlan();
  const routerQuery = useRouterQuery();
  const tab = resolveLabsTab(useRouterParam('tab') ?? null);

  const handleTabChange = (value: string) => {
    routerQuery.push({ key: 'tab', value });
  };

  return (
    <PvTabs value={tab} onValueChange={handleTabChange}>
      <LabsPeek />
      <PvTabsList>
        <PvTabsTrigger value="studio">{m.ui_labs_tab_studio()}</PvTabsTrigger>
        <PvTabsTrigger value="tools">{m.ui_labs_tab_tools()}</PvTabsTrigger>
        <PvTabsTrigger value="training">{m.ui_labs_tab_training()}</PvTabsTrigger>
      </PvTabsList>

      <PvTabsContent value="studio">
        <StudioTab />
      </PvTabsContent>

      <PvTabsContent value="tools">
        <PvPageGrid>
          <div className="lg:col-span-2">
            <RacePredictor />
          </div>
          <div className="lg:col-span-2">
            <PaceCalculator />
          </div>
        </PvPageGrid>
      </PvTabsContent>

      <PvTabsContent value="training">
        {!coach.thresholdPaceSet ? (
          <PvPageGrid>
            <PvActionPromptCard
              title={m.ui_labs_threshold_title()}
              description={m.ui_labs_threshold_desc()}
              className="lg:col-span-2"
            >
              <PvButton asChild variant="secondary">
                <PageLink to={{ page: 'settings', params: {} }}>
                  <Settings size={16} />
                  {m.ui_labs_go_settings()}
                </PageLink>
              </PvButton>
            </PvActionPromptCard>
          </PvPageGrid>
        ) : (
          <PvPageGrid>
            <div className="lg:col-span-2">
              <PvCard>
                <PvCardHeader
                  titleSlot={
                    <div className="flex items-center gap-1">
                      <PvTypography variant="title" as="h3">
                        {METRIC_EXPLANATIONS.trainingZones.friendlyName}
                      </PvTypography>
                      <MetricLabel metricId="trainingZones" size="sm" />
                    </div>
                  }
                  subtitle={METRIC_EXPLANATIONS.trainingZones.oneLiner}
                />
                <ZoneLegend zones={coach.zones} />
              </PvCard>
            </div>
            <div className="lg:col-span-2">
              <PvCard>
                {coach.plan && (
                  <>
                    <PvCardHeader
                      title={m.ui_labs_weekly_plan()}
                      subtitle={m.ui_labs_weekly_plan_subtitle({
                        weekOf: coach.plan.weekOf,
                        tss: String(coach.plan.totalEstimatedTss),
                      })}
                    />
                    <WeeklyPlanTimeline plan={coach.plan} zones={coach.zones} />
                  </>
                )}
              </PvCard>
            </div>
          </PvPageGrid>
        )}
      </PvTabsContent>
    </PvTabs>
  );
};
