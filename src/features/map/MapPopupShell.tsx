import { createPortal } from 'react-dom';
import { Card } from '@/components/ui/Card.tsx';
import { SheetBackdrop } from '@/components/ui/SheetBackdrop.tsx';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop.ts';
import { useDismiss } from './hooks/useDismiss.ts';
import { usePopupPosition } from './hooks/usePopupPosition.ts';
import { cn } from '@/lib/utils.ts';
import type { ReactNode, Ref } from 'react';

interface MapPopupShellProps {
  x: number;
  y: number;
  onClose: () => void;
  isExpanded: boolean;
  /** Card sizing on desktop while not expanded, e.g. 'w-[380px] max-h-[300px]'. */
  desktopSizeClasses: string;
  cardRef: Ref<HTMLDivElement>;
  children: ReactNode;
}

/**
 * Shared chrome for map pick popups: a click-anchored card on desktop,
 * a backdrop-dimmed bottom sheet on mobile.
 */
export const MapPopupShell = (props: MapPopupShellProps) => {
  const isDesktop = useIsDesktop();
  // On mobile the backdrop handles outside taps; pointerdown-outside would unmount
  // the backdrop mid-gesture and let the click re-open a popup on the map below.
  const popupRef = useDismiss(props.onClose, {
    escapeEnabled: !props.isExpanded,
    outsideEnabled: isDesktop,
  });
  const style = usePopupPosition(props.x, props.y);

  let cardSizeClasses = '';
  if (!isDesktop) {
    cardSizeClasses = cn(
      'w-full h-[50dvh] landscape:h-[75dvh] rounded-t-2xl rounded-b-none border-x-0 border-b-0',
      'pb-[max(0.5rem,env(safe-area-inset-bottom))]',
      'pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))]',
    );
  } else if (!props.isExpanded) {
    cardSizeClasses = props.desktopSizeClasses;
  }

  return createPortal(
    <>
      {!isDesktop && <SheetBackdrop onClose={props.onClose} />}
      <div
        ref={popupRef}
        style={isDesktop ? style : undefined}
        className={
          isDesktop
            ? undefined
            : 'fixed inset-x-0 bottom-0 z-50 animate-in slide-in-from-bottom duration-300'
        }
      >
        <Card
          ref={props.cardRef}
          variant="compact"
          className={cn('flex flex-col overflow-hidden', cardSizeClasses)}
        >
          {props.children}
        </Card>
      </div>
    </>,
    document.body,
  );
};
