import { m } from '@/paraglide/messages.js';
import { MapPickPopup } from '@/features/map/MapPickPopup.tsx';
import { StudioRouteItem } from '@/features/studio/StudioRouteItem.tsx';
import type { StudioRoutesPopupInfo } from '@/features/studio/hooks/useStudioRoutesPopup.ts';

/**
 * Studio-tab pick popup: the routes near the clicked point, each opening its
 * detail. The detail page uses the special add-marker popup instead.
 */
export const StudioRoutesPickPopup = (props: {
  info: StudioRoutesPopupInfo;
  onClose: () => void;
}) => {
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
