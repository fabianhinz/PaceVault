import { Download } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import { useStudioStore } from '@/store/studio.ts';
import { Button } from '@pacevault/ui/components/Button.tsx';
import { MapPickPopup } from '@/features/map/MapPickPopup.tsx';
import { toKm } from '@/lib/formatters.ts';
import { AddMarkerButton } from './AddMarkerButton.tsx';
import { segmentAtDistance } from './routeSegments.ts';
import { useStudioRouteExport } from '@/features/studio/hooks/useStudioRouteExport.ts';
import { useStudioRoutePoints } from '@/features/studio/hooks/useStudioRoutePoints.ts';
import { sliceRoute } from '@pacevault/gpx/routeCut.ts';

export interface StudioTrackPickInfo {
  x: number;
  y: number;
  routeId: string;
  distanceM: number;
}

export const StudioTrackPickPopup = (props: { info: StudioTrackPickInfo; onClose: () => void }) => {
  const route = useStudioStore((s) => s.routes.find((r) => r.id === props.info.routeId));
  const routeExport = useStudioRouteExport();
  const routePoints = useStudioRoutePoints(props.info.routeId);

  const splitDistances = (route?.markers ?? [])
    .filter((mk) => mk.type === 'track_modifier')
    .map((mk) => mk.distanceM);
  const hasSplits = splitDistances.length > 0;

  const segment = route
    ? segmentAtDistance(splitDistances, route.distance, props.info.distanceM)
    : null;

  let segmentPointCount = 0;
  if (segment && routePoints.points) {
    segmentPointCount = sliceRoute(routePoints.points, segment.startM, segment.endM).length;
  }
  const segmentTooShort = routePoints.points !== null && segmentPointCount < 2;

  let exportLabel = m.ui_studio_export_segment();
  if (!hasSplits) exportLabel = m.ui_studio_export_route();
  else if (segmentTooShort) exportLabel = m.ui_studio_export_segment_too_short();

  const subtitleParts = [m.ui_studio_pick_from_start({ km: toKm(props.info.distanceM) })];
  if (segment && segment.startSplit !== null) {
    subtitleParts.push(
      m.ui_studio_pick_from_split({ km: toKm(props.info.distanceM - segment.startM) }),
    );
  }

  return (
    <MapPickPopup
      x={props.info.x}
      y={props.info.y}
      title={m.ui_studio_pick_title()}
      subtitle={subtitleParts.join(' · ')}
      onClose={props.onClose}
    >
      <AddMarkerButton
        routeId={props.info.routeId}
        type="track_modifier"
        distanceM={props.info.distanceM}
        onDone={props.onClose}
      />
      <AddMarkerButton
        routeId={props.info.routeId}
        type="point_of_interest"
        distanceM={props.info.distanceM}
        onDone={props.onClose}
      />

      {route && segment && (
        <Button
          variant="secondary"
          className="w-full"
          disabled={segmentPointCount < 2 || routeExport.exporting}
          onClick={() => {
            if (hasSplits) {
              routeExport.exportSegment(route, segment.startM, segment.endM, segment.index);
            } else {
              routeExport.exportRoute(route);
            }
            props.onClose();
          }}
        >
          <Download className="size-4" />
          {exportLabel}
        </Button>
      )}
    </MapPickPopup>
  );
};
