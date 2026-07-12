import { MapPin, Split } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import type { StudioMarker } from '@/store/studio.ts';
import { useStudioMarkerEditorStore } from '@/store/studioMarkerEditor.ts';
import { ListItem } from '@/components/ui/List.tsx';
import { formatDistance, toKm } from '@/lib/formatters.ts';

/**
 * A single marker list item — clicking it opens the edit dialog. Split points
 * use the popup's dotted "from start · from last split" copy; `prevSplitM` is
 * the preceding split's distance (`null` for the first split or waypoints).
 */
export const MarkerRow = (props: {
  routeId: string;
  marker: StudioMarker;
  prevSplitM?: number | null;
}) => {
  const isPoi = props.marker.type === 'point_of_interest';
  const Icon = isPoi ? MapPin : Split;

  let primary: string = props.marker.type === 'point_of_interest' ? props.marker.label : '';
  let secondary = formatDistance(props.marker.distanceM);
  if (props.marker.type === 'track_modifier') {
    primary = m.ui_studio_marker_split_row();
    const parts = [m.ui_studio_pick_from_start({ km: toKm(props.marker.distanceM) })];
    if (props.prevSplitM != null) {
      parts.push(
        m.ui_studio_pick_from_split({ km: toKm(props.marker.distanceM - props.prevSplitM) }),
      );
    }
    secondary = parts.join(' · ');
  }

  return (
    <ListItem
      icon={<Icon className="size-4" />}
      primary={primary}
      secondary={secondary}
      onClick={() =>
        useStudioMarkerEditorStore
          .getState()
          .openEdit(props.routeId, props.marker.id, props.marker.type)
      }
    />
  );
};
