import type { FC } from 'react';
import { Download } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { MapPickPopup } from '@/components/mapBackground/MapPickPopup.tsx';
import { AddMarkerButton } from './AddMarkerButton.tsx';
import type { StudioTrackPickInfo } from '@/components/studio/types.ts';
import { useStudioTrackPickSegment } from '@/components/studio/hooks/useStudioTrackPickSegment.ts';

interface StudioTrackPickPopupProps {
  info: StudioTrackPickInfo;
  onClose: () => void;
}

export const StudioTrackPickPopup: FC<StudioTrackPickPopupProps> = (props) => {
  const pick = useStudioTrackPickSegment(props.info);
  const route = pick.route;
  const segment = pick.segment;

  return (
    <MapPickPopup
      x={props.info.x}
      y={props.info.y}
      title={m.ui_studio_pick_title()}
      subtitle={pick.subtitleParts.join(' · ')}
      onClose={props.onClose}
    >
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
        <PvButton
          variant="secondary"
          className="w-full"
          disabled={pick.segmentPointCount < 2 || pick.routeExport.exporting}
          onClick={() => {
            if (pick.splitsPresent) {
              void pick.routeExport.exportSegment({
                route,
                startM: segment.startM,
                endM: segment.endM,
                index: segment.index,
              });
            } else {
              void pick.routeExport.exportRoute(route);
            }
            props.onClose();
          }}
        >
          <Download className="size-4" />
          {pick.exportLabel}
        </PvButton>
      )}
    </MapPickPopup>
  );
};
