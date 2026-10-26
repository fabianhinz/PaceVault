import type { FC } from 'react';
import { MapPin, Split, type LucideIcon } from 'lucide-react';
import { useStudioStore, type StudioMarkerType } from '@/store/studio.ts';
import { useStudioMarkerEditorStore } from '@/store/studioMarkerEditor.ts';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { ADD_LABEL_BY_STUDIO_MARKER_TYPE } from '@/microcopy/studioMarkers.ts';

const ICON_BY_STUDIO_MARKER_TYPE: Record<StudioMarkerType, LucideIcon> = {
  track_modifier: Split,
  point_of_interest: MapPin,
};

interface AddMarkerButtonProps {
  routeId: string;
  type: StudioMarkerType;
  distanceM?: number;
  className?: string;
  onDone?: () => void;
}

/**
 * Adds a marker of the given type. Shared by the Tools-tab card CTAs and the
 * on-track pick popup. A split point clicked on the map already has its position
 * (`distanceM`), so it saves eagerly; everything else opens the dialog — a
 * waypoint needs a label, a card CTA needs the user to type the distance.
 */
export const AddMarkerButton: FC<AddMarkerButtonProps> = (props) => {
  const Icon = ICON_BY_STUDIO_MARKER_TYPE[props.type];

  const handleClick = () => {
    if (props.type === 'track_modifier' && props.distanceM != null) {
      useStudioStore.getState().addStudioMarker({
        routeId: props.routeId,
        marker: { type: 'track_modifier', distanceM: props.distanceM },
      });
    } else {
      useStudioMarkerEditorStore.getState().openCreate({
        routeId: props.routeId,
        type: props.type,
        initialDistanceM: props.distanceM,
      });
    }
    props.onDone?.();
  };

  return (
    <PvButton variant="secondary" className={cn('w-full', props.className)} onClick={handleClick}>
      <Icon className="size-4" />
      {ADD_LABEL_BY_STUDIO_MARKER_TYPE[props.type]()}
    </PvButton>
  );
};
