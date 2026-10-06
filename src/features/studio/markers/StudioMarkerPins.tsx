import { useMemo } from 'react';
import { Marker } from 'react-map-gl/maplibre';
import { MapPin, Split } from 'lucide-react';
import { useStudioStore } from '@/store/studio.ts';
import { useStudioMarkerEditorStore } from '@/store/studioMarkerEditor.ts';
import { routeColors } from '@/features/studio/routeColors.ts';
import { glassClass } from '@/components/ui/Card.tsx';
import { MAP_MARKER_Z } from '@/features/map/mapZ.ts';
import { cn } from '@/lib/utils.ts';
import { pointAtRouteDistance } from '@/packages/gpx/routeCut.ts';
import { useStudioRoutePoints } from '@/features/studio/hooks/useStudioRoutePoints.ts';

export const StudioMarkerPins = (props: { routeId: string }) => {
  const route = useStudioStore((s) => s.routes.find((r) => r.id === props.routeId));
  const routePoints = useStudioRoutePoints(props.routeId);
  const points = routePoints.points;

  const pins = useMemo(() => {
    if (!route || !points) return [];
    return route.markers
      .map((marker) => {
        const position = pointAtRouteDistance(points, marker.distanceM);
        if (!position) return null;
        return { marker, position };
      })
      .filter((pin) => pin !== null);
  }, [route, points]);

  if (!route) return null;
  const hex = routeColors[route.color].hex;

  return pins.map((pin) => {
    const isPoi = pin.marker.type === 'point_of_interest';
    const Icon = isPoi ? MapPin : Split;
    return (
      <Marker
        key={pin.marker.id}
        longitude={pin.position.lng}
        latitude={pin.position.lat}
        anchor="center"
        className={MAP_MARKER_Z}
        onClick={(e) => {
          e.originalEvent.stopPropagation();
          useStudioMarkerEditorStore.getState().openEdit(route.id, pin.marker.id, pin.marker.type);
        }}
      >
        <button
          type="button"
          className={cn(
            glassClass,
            'flex size-9 cursor-pointer items-center justify-center rounded-lg shadow-lg transition-colors hover:bg-white/10 active:bg-white/15',
          )}
          style={{ color: hex }}
        >
          <Icon size={18} strokeWidth={2} />
        </button>
      </Marker>
    );
  });
};
