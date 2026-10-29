import { useMemo, type FC } from 'react';
import { SessionItem } from '@/components/sessions/SessionItem.tsx';
import { MapPickPopup } from '@/components/mapBackground/MapPickPopup.tsx';
import type { PopupInfo } from './types.ts';
import { m } from '@pacevault/i18n/messages.js';

interface SessionsPickPopupProps {
  info: PopupInfo;
  onClose: () => void;
}

export const SessionsPickPopup: FC<SessionsPickPopupProps> = (props) => {
  const sorted = useMemo(
    () => props.info.sessions.toSorted((a, b) => b.date - a.date),
    [props.info.sessions],
  );

  return (
    <MapPickPopup
      x={props.info.x}
      y={props.info.y}
      title={m.ui_map_popup_sessions_title({ count: String(props.info.sessions.length) })}
      subtitle={m.ui_map_popup_sessions_subtitle()}
      onClose={props.onClose}
    >
      {sorted.map((session) => (
        <SessionItem key={session.id} session={session} onNavigate={props.onClose} />
      ))}
    </MapPickPopup>
  );
};
