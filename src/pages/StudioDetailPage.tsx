import { useParams } from 'react-router-dom';
import { m } from '@/paraglide/messages.js';
import { useStudioStore } from '@/store/studio.ts';
import type { StudioRoute } from '@/store/studio.ts';
import { Typography } from '@/components/ui/Typography.tsx';
import { formatDate } from '@/lib/formatters.ts';
import { StudioRouteHeader } from '@/features/studio/StudioRouteHeader.tsx';
import { StudioActionsMenu } from '@/features/studio/StudioActionsMenu.tsx';
import { RouteStatsGrid } from '@/features/studio/RouteStatsGrid.tsx';
import { RouteElevationProfile } from '@/features/studio/RouteElevationProfile.tsx';
import { useStudioRoutePoints } from '@/features/studio/hooks/useStudioRoutePoints.ts';

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
  const routePoints = useStudioRoutePoints(props.route.id);

  return (
    <div className="space-y-4">
      <StudioRouteHeader route={props.route} titleVariant="h2" titleAs="h1">
        <StudioActionsMenu route={props.route} />
      </StudioRouteHeader>

      <Typography variant="caption" as="p" color="textSecondary">
        {m.ui_studio_meta({
          date: formatDate(props.route.importedAt),
          file: props.route.sourceFileName,
        })}
      </Typography>

      <RouteStatsGrid route={props.route} />

      {routePoints.points && <RouteElevationProfile points={routePoints.points} />}
    </div>
  );
};
