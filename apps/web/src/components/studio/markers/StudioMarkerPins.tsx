import { useMemo, type FC } from 'react';
import { Marker } from 'react-map-gl/maplibre';
import { MapPin, Split } from 'lucide-react';
import { useStudioStore } from '@/store/studio.ts';
import { useStudioMarkerEditorStore } from '@/store/studioMarkerEditor.ts';
import { COLORS_BY_STUDIO_ROUTE_COLOR } from '@/components/studio/routeColors.ts';
import { FLOATING_CLASS } from '@pacevault/ui/lib/surfaces.ts';
import { MAP_MARKER_Z } from '@/components/mapBackground/mapZ.ts';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { pointAtRouteDistance } from '@pacevault/gpx/routeCut.ts';
import { useStudioRoutePoints } from '@/queries/studio/useStudioRoutePoints.ts';

interface StudioMarkerPinsProps {
  routeId: string;
}

export const StudioMarkerPins: FC<StudioMarkerPinsProps> = (props) => {
  const route = useStudioStore((s) => s.routes.find((r) => r.id === props.routeId));
  const points = useStudioRoutePoints({ routeId: props.routeId }).data;

  const pins = useMemo(() => {
    if (!route || !points) return [];
    return route.markers
      .map((marker) => {
        const position = pointAtRouteDistance({ points, distanceMeters: marker.distanceM });
        if (!position) return null;
        return { marker, position };
      })
      .filter((pin) => pin !== null);
  }, [route, points]);

  if (!route) return null;
  const hex = COLORS_BY_STUDIO_ROUTE_COLOR[route.color].hex;

  return pins.map((pin) => {
    const poiMarker = pin.marker.type === 'point_of_interest';
    const Icon = poiMarker ? MapPin : Split;
    return (
      <Marker
        key={pin.marker.id}
        longitude={pin.position.lng}
        latitude={pin.position.lat}
        anchor="center"
        className={MAP_MARKER_Z}
        onClick={(e) => {
          e.originalEvent.stopPropagation();
          useStudioMarkerEditorStore
            .getState()
            .openEdit({ routeId: route.id, markerId: pin.marker.id, type: pin.marker.type });
        }}
      >
        <button
          type="button"
          className={cn(
            FLOATING_CLASS,
            'flex size-9 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-white/10 active:bg-white/15',
          )}
          style={{ color: hex }}
        >
          <Icon size={18} strokeWidth={2} />
        </button>
      </Marker>
    );
  });
};
