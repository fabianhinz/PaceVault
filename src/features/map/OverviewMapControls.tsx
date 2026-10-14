import { SheetAbove } from '@/components/ui/SheetAbove.tsx';
import { useDevice } from '@/lib/hooks/useDevice.ts';
import { cn } from '@/lib/utils.ts';
import { useMapControlsStore } from '@/store/mapControls.ts';
import { MAP_CONTROLS_BOTTOM, MAP_CONTROLS_HEIGHT } from './mapPadding.ts';
import { TrackIntensityControl } from './TrackIntensityControl.tsx';

export const OverviewMapControls = () => {
  const device = useDevice();
  const shown = useMapControlsStore((s) => s.overviewMapControlsShown);

  if (!shown) return null;

  const pills = (
    <div
      className="mx-auto flex w-max items-center gap-2"
      style={{ height: MAP_CONTROLS_HEIGHT }}
      data-testid="overview-map-pills"
    >
      <TrackIntensityControl />
    </div>
  );

  if (device.isDesktop) {
    return (
      <div
        className="pointer-events-none fixed left-[calc(30dvw+2.375rem)] z-20 mb-0 -translate-x-1/2"
        style={{ bottom: MAP_CONTROLS_BOTTOM }}
      >
        {pills}
      </div>
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
