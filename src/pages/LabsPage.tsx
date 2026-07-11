import { Link, useSearchParams } from 'react-router-dom';
import { m } from '@/paraglide/messages.js';
import { useCoachPlan } from '@/features/labs/hooks/useCoachPlan.ts';
import { PageGrid } from '@/components/ui/PageGrid.tsx';
import { Card } from '@/components/ui/Card.tsx';
import { CardHeader } from '@/components/ui/CardHeader.tsx';
import { Typography } from '@/components/ui/Typography.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { MetricLabel } from '@/components/ui/MetricLabel.tsx';
import { ActionPromptCard } from '@/components/ui/ActionPromptCard.tsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs.tsx';
import { METRIC_EXPLANATIONS } from '@/lib/explanations.ts';
import { resolveLabsTab } from '@/lib/labsTab.ts';

import { WeeklyPlanTimeline } from '@/features/labs/WeeklyPlanTimeline.tsx';
import { RacePredictor } from '@/features/labs/RacePredictor.tsx';
import { PaceCalculator } from '@/features/labs/PaceCalculator.tsx';
import { Settings } from 'lucide-react';
import { ZoneLegend } from '@/features/sessions/ZoneLegend.tsx';
import { StudioTab } from '@/features/studio/StudioTab.tsx';

export const LabsPage = () => {
  const coach = useCoachPlan();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = resolveLabsTab(searchParams.get('tab'));

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <Tabs value={tab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="studio">{m.ui_labs_tab_studio()}</TabsTrigger>
        <TabsTrigger value="tools">{m.ui_labs_tab_tools()}</TabsTrigger>
        <TabsTrigger value="training">{m.ui_labs_tab_training()}</TabsTrigger>
      </TabsList>

      <TabsContent value="studio">
        <StudioTab />
      </TabsContent>

      <TabsContent value="tools">
        <PageGrid>
          <div className="lg:col-span-2">
            <RacePredictor />
          </div>
          <div className="lg:col-span-2">
            <PaceCalculator />
          </div>
        </PageGrid>
      </TabsContent>

      <TabsContent value="training">
        {!coach.hasThresholdPace ? (
          <PageGrid>
            <ActionPromptCard
              title={m.ui_labs_threshold_title()}
              description={m.ui_labs_threshold_desc()}
              className="lg:col-span-2"
            >
              <Button asChild variant="secondary">
                <Link to="/settings">
                  <Settings size={16} />
                  {m.ui_labs_go_settings()}
                </Link>
              </Button>
            </ActionPromptCard>
          </PageGrid>
        ) : (
          <PageGrid>
            <div className="lg:col-span-2">
              <Card>
                <CardHeader
                  titleSlot={
                    <div className="flex items-center gap-1">
                      <Typography variant="title" as="h3">
                        {METRIC_EXPLANATIONS.trainingZones.friendlyName}
                      </Typography>
                      <MetricLabel metricId="trainingZones" size="sm" />
                    </div>
                  }
                  subtitle={METRIC_EXPLANATIONS.trainingZones.oneLiner}
                />
                <ZoneLegend zones={coach.zones} />
              </Card>
            </div>
            <div className="lg:col-span-2">
              <Card>
                {coach.plan && (
                  <>
                    <CardHeader
                      title={m.ui_labs_weekly_plan()}
                      subtitle={m.ui_labs_weekly_plan_subtitle({
                        weekOf: coach.plan.weekOf,
                        tss: String(coach.plan.totalEstimatedTss),
                      })}
                    />
                    <WeeklyPlanTimeline plan={coach.plan} zones={coach.zones} />
                  </>
                )}
              </Card>
            </div>
          </PageGrid>
        )}
      </TabsContent>
    </Tabs>
  );
};
