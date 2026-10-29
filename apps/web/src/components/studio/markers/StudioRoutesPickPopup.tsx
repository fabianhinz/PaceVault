import type { FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { MapPickPopup } from '@/components/mapBackground/MapPickPopup.tsx';
import { StudioRouteItem } from '@/components/studio/StudioRouteItem.tsx';
import type { StudioRoutesPopupInfo } from '@/components/studio/types.ts';

interface StudioRoutesPickPopupProps {
  info: StudioRoutesPopupInfo;
  onClose: () => void;
}

/**
 * Studio-tab pick popup: the routes near the clicked point, each opening its
 * detail. The detail page uses the special add-marker popup instead.
 */
export const StudioRoutesPickPopup: FC<StudioRoutesPickPopupProps> = (props) => {
  return (
    <MapPickPopup
      x={props.info.x}
      y={props.info.y}
      title={m.ui_map_popup_routes_title({ count: String(props.info.routes.length) })}
      subtitle={m.ui_map_popup_routes_subtitle()}
      onClose={props.onClose}
    >
      {props.info.routes.map((route) => (
        <StudioRouteItem key={route.id} route={route} onNavigate={props.onClose} />
      ))}
    </MapPickPopup>
  );
};
