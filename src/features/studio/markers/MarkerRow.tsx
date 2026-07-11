import { MapPin, Split } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import type { StudioMarker } from '@/store/studio.ts';
import { useStudioMarkerEditorStore } from '@/store/studioMarkerEditor.ts';
import { ListItem } from '@/components/ui/List.tsx';
import { formatDistance } from '@/lib/formatters.ts';

/** A single marker list item — clicking it opens the edit dialog. */
export const MarkerRow = (props: { routeId: string; marker: StudioMarker }) => {
  const isPoi = props.marker.type === 'point_of_interest';
  const Icon = isPoi ? MapPin : Split;
  const primary =
    props.marker.type === 'point_of_interest' ? props.marker.label : m.ui_studio_marker_split_row();

  return (
    <ListItem
      icon={<Icon className="size-4" />}
      primary={primary}
      secondary={formatDistance(props.marker.distanceM)}
      onClick={() =>
        useStudioMarkerEditorStore
          .getState()
          .openEdit(props.routeId, props.marker.id, props.marker.type)
      }
    />
  );
};
