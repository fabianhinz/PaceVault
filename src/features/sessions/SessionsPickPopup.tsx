import { useMemo } from 'react';
import { SessionItem } from '@/features/sessions/SessionItem.tsx';
import { MapPickPopup } from '@/features/map/MapPickPopup.tsx';
import { useLayoutStore } from '@/store/layout.ts';
import type { TrainingSession } from '@/packages/engine/types.ts';
import { m } from '@/paraglide/messages.js';

export interface PopupInfo {
  x: number;
  y: number;
  sessions: TrainingSession[];
}

interface SessionsPickPopupProps {
  info: PopupInfo;
  onClose: () => void;
}

export const SessionsPickPopup = (props: SessionsPickPopupProps) => {
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
        <SessionItem
          key={session.id}
          session={session}
          onNavigate={() => {
            props.onClose();
            if (useLayoutStore.getState().mobileMapActive) {
              useLayoutStore.getState().toggleMobileMap();
            }
          }}
        />
      ))}
    </MapPickPopup>
  );
};
