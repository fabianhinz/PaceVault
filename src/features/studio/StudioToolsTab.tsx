import { m } from '@/paraglide/messages.js';
import type { StudioMarker, StudioMarkerType, StudioRoute } from '@/store/studio.ts';
import { PageGrid } from '@/components/ui/PageGrid.tsx';
import { Card } from '@/components/ui/Card.tsx';
import { CardHeader } from '@/components/ui/CardHeader.tsx';
import { List } from '@/components/ui/List.tsx';
import { MarkerRow } from './markers/MarkerRow.tsx';
import { AddMarkerButton } from './markers/AddMarkerButton.tsx';

const MarkerCard = (props: {
  routeId: string;
  type: StudioMarkerType;
  title: string;
  subtitle: string;
  markers: StudioMarker[];
}) => (
  <Card>
    <CardHeader title={props.title} subtitle={props.subtitle} />
    {props.markers.length > 0 && (
      <List>
        {props.markers.map((marker) => (
          <MarkerRow key={marker.id} routeId={props.routeId} marker={marker} />
        ))}
      </List>
    )}
    <AddMarkerButton routeId={props.routeId} type={props.type} className="mt-2" />
  </Card>
);

export const StudioToolsTab = (props: { route: StudioRoute }) => {
  const splits = props.route.markers
    .filter((mk) => mk.type === 'track_modifier')
    .sort((a, b) => a.distanceM - b.distanceM);
  const waypoints = props.route.markers
    .filter((mk) => mk.type === 'point_of_interest')
    .sort((a, b) => a.distanceM - b.distanceM);

  return (
    <PageGrid>
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
    </PageGrid>
  );
};
