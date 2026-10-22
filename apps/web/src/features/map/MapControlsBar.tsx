import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { SheetAbove } from '@pacevault/ui/components/SheetAbove.tsx';
import { useDevice } from '@pacevault/ui/hooks/useDevice.ts';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { MAP_CONTROLS_BOTTOM, MAP_CONTROLS_HEIGHT } from './mapPadding.ts';

export const MapControlsBar = (props: { testId: string; children: ReactNode }) => {
  const device = useDevice();

  const pills = (
    <div
      className="mx-auto flex w-max items-center gap-2"
      style={{ height: MAP_CONTROLS_HEIGHT }}
      data-testid={props.testId}
    >
      {props.children}
    </div>
  );

  if (device.isDesktop) {
    return createPortal(
      <div
        className="pointer-events-none fixed left-[calc(30dvw+2.375rem)] z-20 mb-0 -translate-x-1/2"
        style={{ bottom: MAP_CONTROLS_BOTTOM }}
      >
        {pills}
      </div>,
      document.body,
    );
  }
  return (
    <SheetAbove>
      <div
        className={cn(
          'pointer-events-auto max-w-full touch-pan-x overflow-x-auto overscroll-x-contain px-4',
          '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        )}
      >
        {pills}
      </div>
    </SheetAbove>
  );
};
