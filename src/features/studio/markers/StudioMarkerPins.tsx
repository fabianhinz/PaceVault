import { useMemo } from 'react';
import { Marker } from 'react-map-gl/maplibre';
import { MapPin, Split } from 'lucide-react';
import { useStudioStore } from '@/store/studio.ts';
import { useStudioMarkerEditorStore } from '@/store/studioMarkerEditor.ts';
import { routeColors } from '@/features/studio/routeColors.ts';
import { glassClass } from '@/components/ui/Card.tsx';
import { MAP_MARKER_Z } from '@/features/map/mapZ.ts';
import { cn } from '@/lib/utils.ts';
import { positionAtDistance } from './markerGeometry.ts';

/**
 * Renders the focused route's markers as clickable pins on the shared map. Must
 * live inside the MapGL tree. Clicking a pin opens the shared edit dialog.
 */
export const StudioMarkerPins = (props: { routeId: string }) => {
  const route = useStudioStore((s) => s.routes.find((r) => r.id === props.routeId));

  const pins = useMemo(() => {
    if (!route) return [];
    return route.markers
      .map((marker) => {
        const position = positionAtDistance(route.id, route.encodedPolylines, marker.distanceM);
        if (!position) return null;
        return { marker, position };
      })
      .filter((pin) => pin !== null);
  }, [route]);

  if (!route) return null;
  const hex = routeColors[route.color].hex;

  return pins.map((pin) => {
    const isPoi = pin.marker.type === 'point_of_interest';
    const Icon = isPoi ? MapPin : Split;
    return (
      <Marker
        key={pin.marker.id}
        longitude={pin.position[0]}
        latitude={pin.position[1]}
        anchor="center"
        // Lift the pin above deck.gl's overlaid track canvas — see MAP_MARKER_Z.
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
