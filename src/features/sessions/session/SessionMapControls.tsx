import { useEffect, useRef } from 'react';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { SheetAbove } from '@/components/ui/SheetAbove.tsx';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop.ts';
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
  const isDesktop = useIsDesktop();
  const coloring = useSessionColorModes(props.session, props.records);
  const effective = coloring.effective;
  const hasSelectedLap = useMapFocusStore((s) => s.selectedLapIndex !== null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    useMapFocusStore.getState().setTrackColorMode(effective);
  }, [effective]);

  useEffect(() => {
    const element = scroller.current;
    if (!element || !hasSelectedLap) return;
    element.scrollLeft = element.scrollWidth;
  }, [hasSelectedLap]);

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

  if (isDesktop) {
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
        ref={scroller}
        className={cn(
          'pointer-events-none w-full overflow-x-auto px-4',
          '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        )}
      >
        {pills}
      </div>
    </SheetAbove>
  );
};
