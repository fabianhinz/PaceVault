import { MapPin, Split, type LucideIcon } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { useStudioStore, type StudioMarkerType } from '@/store/studio.ts';
import { useStudioMarkerEditorStore } from '@/store/studioMarkerEditor.ts';
import { Button } from '@/components/ui/Button.tsx';
import { cn } from '@/lib/utils.ts';

const options: Record<StudioMarkerType, { icon: LucideIcon; label: () => string }> = {
  track_modifier: { icon: Split, label: () => m.ui_studio_marker_add_split() },
  point_of_interest: { icon: MapPin, label: () => m.ui_studio_marker_add_waypoint() },
};

/**
 * Adds a marker of the given type. Shared by the Tools-tab card CTAs and the
 * on-track pick popup. A split point clicked on the map already has its position
 * (`distanceM`), so it saves eagerly; everything else opens the dialog — a
 * waypoint needs a label, a card CTA needs the user to type the distance.
 */
export const AddMarkerButton = (props: {
  routeId: string;
  type: StudioMarkerType;
  distanceM?: number;
  className?: string;
  onDone?: () => void;
}) => {
  const option = options[props.type];
  const Icon = option.icon;

  const handleClick = () => {
    if (props.type === 'track_modifier' && props.distanceM != null) {
      useStudioStore
        .getState()
        .addStudioMarker(props.routeId, { type: 'track_modifier', distanceM: props.distanceM });
    } else {
      useStudioMarkerEditorStore.getState().openCreate(props.routeId, props.type, props.distanceM);
    }
    props.onDone?.();
  };

  return (
    <Button variant="secondary" className={cn('w-full', props.className)} onClick={handleClick}>
      <Icon className="size-4" />
      {option.label()}
    </Button>
  );
};
