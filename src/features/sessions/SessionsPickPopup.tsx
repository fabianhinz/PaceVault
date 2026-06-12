import { useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Maximize2, Minimize2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';
import { Card } from '@/components/ui/Card.tsx';
import { CardHeader } from '@/components/ui/CardHeader.tsx';
import { SheetBackdrop } from '@/components/ui/SheetBackdrop.tsx';
import { SessionItem } from '@/features/sessions/SessionItem.tsx';
import { useExpandCard } from '@/lib/hooks/useExpandCard.ts';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop.ts';
import { usePopupPosition } from '../map/hooks/usePopupPosition.ts';
import { useDismiss } from '../map/hooks/useDismiss.ts';
import { cn } from '@/lib/utils.ts';
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
  const cardRef = useRef<HTMLDivElement>(null);
  const expandCard = useExpandCard(cardRef);
  const isDesktop = useIsDesktop();
  // On mobile the backdrop handles outside taps; pointerdown-outside would unmount
  // the backdrop mid-gesture and let the click re-open a popup on the map below.
  const popupRef = useDismiss(props.onClose, !expandCard.isExpanded, isDesktop);

  const style = usePopupPosition(props.info.x, props.info.y);

  const sorted = useMemo(
    () => props.info.sessions.toSorted((a, b) => b.date - a.date),
    [props.info.sessions],
  );

  // Mobile: bottom sheet. Desktop: click-anchored card (sized unless expanded).
  let cardSizeClasses = '';
  if (!isDesktop) {
    cardSizeClasses = 'w-full h-[50dvh] rounded-t-2xl rounded-b-none border-x-0 border-b-0';
  } else if (!expandCard.isExpanded) {
    cardSizeClasses = 'w-[380px] max-h-[300px]';
  }

  return createPortal(
    <>
      {!isDesktop && <SheetBackdrop onClose={props.onClose} />}
      <div
        ref={popupRef}
        style={isDesktop ? style : undefined}
        className={cn(
          !isDesktop &&
            'fixed inset-x-0 bottom-0 z-50 animate-in slide-in-from-bottom duration-300',
        )}
      >
        <Card
          ref={cardRef}
          variant="compact"
          className={cn('flex flex-col overflow-hidden', cardSizeClasses)}
        >
          <CardHeader
            title={m.ui_map_popup_sessions_title({ count: String(props.info.sessions.length) })}
            subtitle={m.ui_map_popup_sessions_subtitle()}
            actions={
              <>
                {isDesktop && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={expandCard.isExpanded ? m.ui_btn_collapse() : m.ui_btn_expand()}
                    onClick={expandCard.toggle}
                  >
                    {expandCard.isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={m.ui_btn_close()}
                  onClick={props.onClose}
                >
                  <X size={16} />
                </Button>
              </>
            }
          />
          <div className={cn('overflow-y-auto min-h-0 space-y-2')}>
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
          </div>
        </Card>
      </div>
    </>,
    document.body,
  );
};
