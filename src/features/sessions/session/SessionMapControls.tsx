import { useEffect } from 'react';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { SheetAbove } from '@/components/ui/SheetAbove.tsx';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop.ts';
import type { SessionLap, SessionRecord, TrainingSession } from '@/packages/engine/types.ts';
import { ColorByControl } from './ColorByControl.tsx';
import { LapsControl } from './LapsControl.tsx';
import { LapPeek } from './LapPeek.tsx';
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

  useEffect(() => {
    useMapFocusStore.getState().setTrackColorMode(effective);
  }, [effective]);

  const pills = (
    <div className="flex items-center gap-2">
      <ColorByControl
        sport={props.session.sport}
        effective={effective}
        statuses={coloring.statuses}
      />
      <LapsControl records={props.records} laps={props.laps} />
    </div>
  );

  if (isDesktop) {
    return (
      <>
        <div className="pointer-events-none fixed bottom-[4.5rem] left-[calc(30dvw+2.375rem)] z-20 -translate-x-1/2">
          <LapPeek variant="desktop" sport={props.session.sport} />
        </div>
        <div className="pointer-events-none fixed bottom-6 left-[calc(30dvw+2.375rem)] z-20 -translate-x-1/2">
          {pills}
        </div>
      </>
    );
  }
  if (hasSelectedLap) {
    return (
      <SheetAbove>
        <LapPeek variant="phone" sport={props.session.sport} />
      </SheetAbove>
    );
  }
  return <SheetAbove>{pills}</SheetAbove>;
};
