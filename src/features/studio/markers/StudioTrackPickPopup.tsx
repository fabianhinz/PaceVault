import { useRef } from 'react';
import { Download, X } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { useStudioStore } from '@/store/studio.ts';
import { Button } from '@/components/ui/Button.tsx';
import { CardHeader } from '@/components/ui/CardHeader.tsx';
import { MapPopupShell } from '@/features/map/MapPopupShell.tsx';
import { toKm } from '@/lib/formatters.ts';
import { AddMarkerButton } from './AddMarkerButton.tsx';
import { segmentAtDistance } from './routeSegments.ts';
import { useStudioSegmentExport } from '@/features/studio/hooks/useStudioSegmentExport.ts';

export interface StudioTrackPickInfo {
  x: number;
  y: number;
  routeId: string;
  /** Distance from the route start to the clicked point, in metres. */
  distanceM: number;
}

/**
 * Shown when the user clicks the focused route on the map: pick which kind of
 * marker to drop at that point, or export the segment the click falls into. The
 * add actions are the same ones the Tools-tab cards use.
 */
export const StudioTrackPickPopup = (props: { info: StudioTrackPickInfo; onClose: () => void }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const route = useStudioStore((s) => s.routes.find((r) => r.id === props.info.routeId));
  const segmentExport = useStudioSegmentExport();

  const splitDistances = (route?.markers ?? [])
    .filter((mk) => mk.type === 'track_modifier')
    .map((mk) => mk.distanceM);
  const hasSplits = splitDistances.length > 0;

  const segment = route
    ? segmentAtDistance(splitDistances, route.distance, props.info.distanceM)
    : null;

  // When the click sits past a split, also show how far into the current segment
  // the new marker lands.
  const subtitleParts = [m.ui_studio_pick_from_start({ km: toKm(props.info.distanceM) })];
  if (segment && segment.startSplit !== null) {
    subtitleParts.push(
      m.ui_studio_pick_from_split({ km: toKm(props.info.distanceM - segment.startM) }),
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

        {route && segment && (
          <Button
            variant="secondary"
            className="w-full"
            disabled={!hasSplits || segmentExport.exporting}
            onClick={() => {
              segmentExport.exportSegment(route, segment.startM, segment.endM, segment.index);
              props.onClose();
            }}
          >
            <Download className="size-4" />
            {hasSplits ? m.ui_studio_export_segment() : m.ui_studio_export_needs_split()}
          </Button>
        )}
      </div>
    </MapPopupShell>
  );
};
