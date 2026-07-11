import { MapPin, Split, type LucideIcon } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import type { StudioMarkerType } from '@/store/studio.ts';
import { useStudioMarkerEditorStore } from '@/store/studioMarkerEditor.ts';
import { Button } from '@/components/ui/Button.tsx';
import { cn } from '@/lib/utils.ts';

const options: Record<StudioMarkerType, { icon: LucideIcon; label: () => string }> = {
  track_modifier: { icon: Split, label: () => m.ui_studio_marker_add_split() },
  point_of_interest: { icon: MapPin, label: () => m.ui_studio_marker_add_waypoint() },
};

/**
 * Opens the create dialog for a marker type. Shared by the Tools-tab card CTAs
 * and the on-track pick popup — the popup passes a `distanceM` so the new marker
 * lands where the user clicked.
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
  return (
    <Button
      variant="secondary"
      className={cn('w-full', props.className)}
      onClick={() => {
        useStudioMarkerEditorStore
          .getState()
          .openCreate(props.routeId, props.type, props.distanceM);
        props.onDone?.();
      }}
    >
      <Icon className="size-4" />
      {option.label()}
    </Button>
  );
};
