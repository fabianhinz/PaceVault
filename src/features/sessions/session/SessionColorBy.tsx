import { useEffect } from 'react';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { SheetAbove } from '@/components/ui/SheetAbove.tsx';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop.ts';
import type { SessionRecord, TrainingSession } from '@/packages/engine/types.ts';
import { ColorByControl } from './ColorByControl.tsx';
import { useSessionColorModes } from './hooks/useSessionColorModes.ts';

export const SessionColorBy = (props: { session: TrainingSession; records: SessionRecord[] }) => {
  const isDesktop = useIsDesktop();
  const coloring = useSessionColorModes(props.session, props.records);
  const effective = coloring.effective;

  useEffect(() => {
    useMapFocusStore.getState().setTrackColorMode(effective);
  }, [effective]);

  const control = (
    <ColorByControl
      sport={props.session.sport}
      effective={effective}
      statuses={coloring.statuses}
    />
  );

  if (isDesktop) {
    return (
      <div className="pointer-events-none fixed bottom-6 left-[calc(30dvw+2.375rem)] z-20 -translate-x-1/2">
        {control}
      </div>
    );
  }
  return <SheetAbove>{control}</SheetAbove>;
};
