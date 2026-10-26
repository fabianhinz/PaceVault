import type { FC } from 'react';
import { MapPin, Split } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import type { StudioMarker } from '@/store/studio.ts';
import { useStudioMarkerEditorStore } from '@/store/studioMarkerEditor.ts';
import { PvListItem } from '@pacevault/ui/components/pvList/PvListItem.tsx';
import { formatDistance, toKm } from '@/lib/formatters.ts';

interface MarkerRowProps {
  routeId: string;
  marker: StudioMarker;
  prevSplitM?: number | null;
}

/**
 * A single marker list item — clicking it opens the edit dialog. Split points
 * use the popup's dotted "from start · from last split" copy; `prevSplitM` is
 * the preceding split's distance (`null` for the first split or waypoints).
 */
export const MarkerRow: FC<MarkerRowProps> = (props) => {
  const poiMarker = props.marker.type === 'point_of_interest';
  const Icon = poiMarker ? MapPin : Split;

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
    <PvListItem
      icon={<Icon className="size-4" />}
      primary={primary}
      secondary={secondary}
      onClick={() =>
        useStudioMarkerEditorStore
          .getState()
          .openEdit({ routeId: props.routeId, markerId: props.marker.id, type: props.marker.type })
      }
    />
  );
};
