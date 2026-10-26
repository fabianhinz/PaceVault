import type { FC } from 'react';
import { useRouterParam } from '@/routing/useRouterParam.ts';
import { useRouterQuery } from '@/routing/useRouterQuery.ts';
import { m } from '@pacevault/i18n/messages.js';
import type { StudioRoute } from '@/store/studio.ts';
import { PvTabs } from '@pacevault/ui/components/pvTabs/PvTabs.tsx';
import { PvTabsList } from '@pacevault/ui/components/pvTabs/PvTabsList.tsx';
import { PvTabsTrigger } from '@pacevault/ui/components/pvTabs/PvTabsTrigger.tsx';
import { PvTabsContent } from '@pacevault/ui/components/pvTabs/PvTabsContent.tsx';
import { StudioRouteHeader } from '@/features/studio/StudioRouteHeader.tsx';
import { StudioActionsMenu } from '@/features/studio/StudioActionsMenu.tsx';
import { RouteStatsGrid } from '@/features/studio/RouteStatsGrid.tsx';
import { RouteChartsExplorer } from '@/features/studio/charts/RouteChartsExplorer.tsx';
import { StudioToolsTab } from '@/features/studio/StudioToolsTab.tsx';
import { StudioMarkerDialog } from '@/features/studio/markers/StudioMarkerDialog.tsx';
import { StudioRoutePeek } from '@/features/studio/StudioRoutePeek.tsx';
import { useStudioRoutePoints } from '@/queries/studio/useStudioRoutePoints.ts';

const validTabs = new Set(['overview', 'tools']);

interface StudioDetailProps {
  route: StudioRoute;
}

export const StudioDetail: FC<StudioDetailProps> = (props) => {
  const rawTab = useRouterParam('tab') ?? null;
  const routerQuery = useRouterQuery();
  const tab = rawTab && validTabs.has(rawTab) ? rawTab : 'overview';
  const routePoints = useStudioRoutePoints({ routeId: props.route.id });

  const handleTabChange = (value: string) => {
    routerQuery.push({ key: 'tab', value });
  };

  return (
    <div className="space-y-4">
      <StudioRoutePeek route={props.route} />
      <StudioRouteHeader route={props.route} titleVariant="h2" titleAs="h1">
        <StudioActionsMenu route={props.route} />
      </StudioRouteHeader>

      <PvTabs defaultValue="overview" value={tab} onValueChange={handleTabChange}>
        <PvTabsList>
          <PvTabsTrigger value="overview">{m.ui_studio_tab_overview()}</PvTabsTrigger>
          <PvTabsTrigger value="tools">{m.ui_studio_tab_tools()}</PvTabsTrigger>
        </PvTabsList>

        <PvTabsContent value="overview">
          <div className="space-y-4">
            <RouteStatsGrid route={props.route} />
            {routePoints.data && (
              <RouteChartsExplorer points={routePoints.data} elevation={props.route.elevation} />
            )}
          </div>
        </PvTabsContent>

        <PvTabsContent value="tools">
          <StudioToolsTab route={props.route} />
        </PvTabsContent>
      </PvTabs>

      <StudioMarkerDialog route={props.route} />
    </div>
  );
};
