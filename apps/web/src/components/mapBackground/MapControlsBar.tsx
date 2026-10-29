import type { FC, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { PvSheetAbove } from '@pacevault/ui/components/pvBottomSheet/PvSheetAbove.tsx';
import { useDevice } from '@pacevault/ui/hooks/useDevice.ts';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { MAP_CONTROLS_BOTTOM, MAP_CONTROLS_HEIGHT } from './mapPadding.ts';

interface MapControlsBarProps {
  testId: string;
  children: ReactNode;
}

export const MapControlsBar: FC<MapControlsBarProps> = (props) => {
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

  if (device.desktop) {
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
    <PvSheetAbove>
      <div
        className={cn(
          'pointer-events-auto max-w-full touch-pan-x overflow-x-auto overscroll-x-contain px-4',
          '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        )}
      >
        {pills}
      </div>
    </PvSheetAbove>
  );
};
