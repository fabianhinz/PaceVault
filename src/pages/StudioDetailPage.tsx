import { useParams, useSearchParams } from 'react-router-dom';
import { m } from '@/paraglide/messages.js';
import { useStudioStore } from '@/store/studio.ts';
import type { StudioRoute } from '@/store/studio.ts';
import { Typography } from '@/components/ui/Typography.tsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs.tsx';
import { StudioRouteHeader } from '@/features/studio/StudioRouteHeader.tsx';
import { StudioActionsMenu } from '@/features/studio/StudioActionsMenu.tsx';
import { RouteStatsGrid } from '@/features/studio/RouteStatsGrid.tsx';
import { RouteChartsExplorer } from '@/features/studio/charts/RouteChartsExplorer.tsx';
import { StudioToolsTab } from '@/features/studio/StudioToolsTab.tsx';
import { useStudioRoutePoints } from '@/features/studio/hooks/useStudioRoutePoints.ts';

const validTabs = new Set(['overview', 'tools']);

// The map picks up this page itself: useStudioMapTracks derives the focused
// route synchronously from the /studio/:id URL, so no effect is needed here.
export const StudioDetailPage = () => {
  const params = useParams<{ id: string }>();
  const route = useStudioStore((s) => s.routes.find((r) => r.id === params.id));

  if (!route) {
    return (
      <Typography variant="body1" color="textSecondary">
        {m.ui_studio_not_found()}
      </Typography>
    );
  }

  return <StudioDetail route={route} />;
};

const StudioDetail = (props: { route: StudioRoute }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const tab = rawTab && validTabs.has(rawTab) ? rawTab : 'overview';
  const routePoints = useStudioRoutePoints(props.route.id);

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <div className="space-y-4">
      <StudioRouteHeader route={props.route} titleVariant="h2" titleAs="h1">
        <StudioActionsMenu route={props.route} />
      </StudioRouteHeader>

      <Tabs defaultValue="overview" value={tab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="overview">{m.ui_studio_tab_overview()}</TabsTrigger>
          <TabsTrigger value="tools">{m.ui_studio_tab_tools()}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-4">
            <RouteStatsGrid route={props.route} />
            {routePoints.points && <RouteChartsExplorer points={routePoints.points} />}
          </div>
        </TabsContent>

        <TabsContent value="tools">
          <StudioToolsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};
