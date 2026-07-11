import { useRef } from 'react';
import { X } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { useStudioStore } from '@/store/studio.ts';
import { Button } from '@/components/ui/Button.tsx';
import { CardHeader } from '@/components/ui/CardHeader.tsx';
import { MapPopupShell } from '@/features/map/MapPopupShell.tsx';
import { AddMarkerButton } from './AddMarkerButton.tsx';

export interface StudioTrackPickInfo {
  x: number;
  y: number;
  routeId: string;
  /** Distance from the route start to the clicked point, in metres. */
  distanceM: number;
}

const toKm = (metres: number): string => (metres / 1000).toFixed(2);

/**
 * Shown when the user clicks the focused route on the map: pick which kind of
 * marker to drop at that point. The add actions are the same ones the Tools-tab
 * cards use, pre-seeded with the clicked distance.
 */
export const StudioTrackPickPopup = (props: { info: StudioTrackPickInfo; onClose: () => void }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const markers = useStudioStore((s) => s.routes.find((r) => r.id === props.info.routeId)?.markers);

  // The split point immediately before the click — how far this new marker sits
  // into the current segment.
  const lastSplitM = (markers ?? [])
    .filter((mk) => mk.type === 'track_modifier' && mk.distanceM <= props.info.distanceM)
    .reduce<number | null>((furthest, mk) => Math.max(furthest ?? 0, mk.distanceM), null);

  const subtitleParts = [m.ui_studio_pick_from_start({ km: toKm(props.info.distanceM) })];
  if (lastSplitM !== null) {
    subtitleParts.push(
      m.ui_studio_pick_from_split({ km: toKm(props.info.distanceM - lastSplitM) }),
    );
  }

  return (
    <MapPopupShell
      x={props.info.x}
      y={props.info.y}
      onClose={props.onClose}
      isExpanded={false}
      desktopSizeClasses="w-[300px]"
      cardRef={cardRef}
    >
      <CardHeader
        title={m.ui_studio_pick_title()}
        subtitle={subtitleParts.join(' · ')}
        actions={
          <Button variant="ghost" size="icon" aria-label={m.ui_btn_close()} onClick={props.onClose}>
            <X size={16} />
          </Button>
        }
      />
      <div className="space-y-2">
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
      </div>
    </MapPopupShell>
  );
};
