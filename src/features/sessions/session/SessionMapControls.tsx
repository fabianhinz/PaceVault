import { useEffect } from 'react';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { SheetAbove } from '@/components/ui/SheetAbove.tsx';
import { useDevice } from '@/lib/hooks/useDevice.ts';
import { cn } from '@/lib/utils.ts';
import { MAP_CONTROLS_BOTTOM, MAP_CONTROLS_HEIGHT } from '@/features/map/mapPadding.ts';
import type { SessionLap, SessionRecord, TrainingSession } from '@/packages/engine/types.ts';
import { ColorByControl } from './ColorByControl.tsx';
import { LapsControl } from './LapsControl.tsx';
import { useSessionColorModes } from './hooks/useSessionColorModes.ts';

interface SessionMapControlsProps {
  session: TrainingSession;
  records: SessionRecord[];
  laps: SessionLap[];
}

export const SessionMapControls = (props: SessionMapControlsProps) => {
  const device = useDevice();
  const coloring = useSessionColorModes(props.session, props.records);
  const effective = coloring.effective;

  useEffect(() => {
    useMapFocusStore.getState().setTrackColorMode(effective);
  }, [effective]);

  const pills = (
    <div
      className="mx-auto flex w-max items-center gap-2"
      style={{ height: MAP_CONTROLS_HEIGHT }}
      data-testid="map-pills"
    >
      <ColorByControl
        sport={props.session.sport}
        effective={effective}
        options={coloring.options}
        speedScale={coloring.speedScale}
      />
      <LapsControl records={props.records} laps={props.laps} sport={props.session.sport} />
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
