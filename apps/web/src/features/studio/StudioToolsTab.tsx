import type { FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import type { StudioRoute } from '@/store/studio.ts';
import { PvPageGrid } from '@pacevault/ui/components/pvPageGrid/PvPageGrid.tsx';
import { MarkerCard } from '@/features/studio/MarkerCard.tsx';

interface StudioToolsTabProps {
  route: StudioRoute;
}

export const StudioToolsTab: FC<StudioToolsTabProps> = (props) => {
  const splits = props.route.markers
    .filter((mk) => mk.type === 'track_modifier')
    .sort((a, b) => a.distanceM - b.distanceM);
  const waypoints = props.route.markers
    .filter((mk) => mk.type === 'point_of_interest')
    .sort((a, b) => a.distanceM - b.distanceM);

  return (
    <PvPageGrid>
      <MarkerCard
        routeId={props.route.id}
        type="track_modifier"
        title={m.ui_studio_tools_splits_title()}
        subtitle={m.ui_studio_tools_splits_desc()}
        markers={splits}
      />
      <MarkerCard
        routeId={props.route.id}
        type="point_of_interest"
        title={m.ui_studio_tools_waypoints_title()}
        subtitle={m.ui_studio_tools_waypoints_desc()}
        markers={waypoints}
      />
    </PvPageGrid>
  );
};
