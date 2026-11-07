import type { FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { PerformanceChart } from '@/components/dashboard/PerformanceChart.tsx';
import { LoadChart } from '@/components/dashboard/LoadChart.tsx';
import { VolumeChart } from '@/components/dashboard/VolumeChart.tsx';
import { PvPageGrid } from '@pacevault/ui/components/pvPageGrid/PvPageGrid.tsx';
import { PvChartsCard } from '@pacevault/ui/components/pvChartsCard/PvChartsCard.tsx';
import { PvTabs } from '@pacevault/ui/components/pvTabs/PvTabs.tsx';
import { PvTabsList } from '@pacevault/ui/components/pvTabs/PvTabsList.tsx';
import { PvTabsTrigger } from '@pacevault/ui/components/pvTabs/PvTabsTrigger.tsx';
import { PvTabsContent } from '@pacevault/ui/components/pvTabs/PvTabsContent.tsx';
import { FormStatusCard } from '@/components/dashboard/FormStatusCard.tsx';
import { DashboardPeek } from '@/components/dashboard/DashboardPeek.tsx';
import { DashboardZoomReset } from '@/components/dashboard/DashboardZoomReset.tsx';
import { SegmentsTab } from '@/components/segments/SegmentsTab.tsx';
import { useRouterParam } from '@/routing/useRouterParam.ts';
import { useRouterQuery } from '@/routing/useRouterQuery.ts';
import { resolveDashboardTab } from '@/routing/dashboardTab.ts';

export const Dashboard: FC = () => {
  const routerQuery = useRouterQuery();
  const tab = resolveDashboardTab(useRouterParam('tab') ?? null);

  return (
    <PvTabs value={tab} onValueChange={(value) => routerQuery.push({ key: 'tab', value })}>
      <DashboardPeek />
      <PvTabsList>
        <PvTabsTrigger value="dashboard">{m.ui_nav_dashboard()}</PvTabsTrigger>
        <PvTabsTrigger value="segments">{m.ui_dashboard_tab_segments()}</PvTabsTrigger>
      </PvTabsList>

      <PvTabsContent value="dashboard">
        <PvPageGrid>
          <FormStatusCard />
          <PvChartsCard zoomReset={<DashboardZoomReset />}>
            <LoadChart />
            <VolumeChart />
            <PerformanceChart />
          </PvChartsCard>
        </PvPageGrid>
      </PvTabsContent>

      <PvTabsContent value="segments">
        <SegmentsTab />
      </PvTabsContent>
    </PvTabs>
  );
};
