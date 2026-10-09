import { createPortal } from 'react-dom';
import { Card } from '@/components/ui/Card.tsx';
import { SheetBackdrop } from '@/components/ui/SheetBackdrop.tsx';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop.ts';
import { useDismiss } from '@/lib/hooks/useDismiss.ts';
import { usePopupPosition } from './hooks/usePopupPosition.ts';
import { cn } from '@/lib/utils.ts';
import type { ReactNode } from 'react';

interface MapPopupShellProps {
  x: number;
  y: number;
  onClose: () => void;
  desktopSizeClasses: string;
  children: ReactNode;
}

export const MapPopupShell = (props: MapPopupShellProps) => {
  const isDesktop = useIsDesktop();
  const popupRef = useDismiss(props.onClose, {
    escapeEnabled: true,
    outsideEnabled: isDesktop,
  });
  const style = usePopupPosition(props.x, props.y);

  let cardSizeClasses = props.desktopSizeClasses;
  if (!isDesktop) {
    cardSizeClasses = cn(
      'w-full h-[50dvh] landscape:h-[75dvh] rounded-t-2xl rounded-b-none border-x-0 border-b-0',
      'pb-[max(0.5rem,env(safe-area-inset-bottom))]',
      'pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))]',
    );
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
          variant="compact"
          floating
          className={cn('flex flex-col overflow-hidden', cardSizeClasses)}
        >
          {props.children}
        </Card>
      </div>
    </>,
    document.body,
  );
};
