import { useEffect } from 'react';
import { useMapControlsStore } from '@/store/mapControls.ts';
import { MapControlsBar } from '@/features/map/MapControlsBar.tsx';
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
  const coloring = useSessionColorModes(props.session, props.records);
  const effective = coloring.effective;

  useEffect(() => {
    useMapControlsStore.getState().setTrackColorMode(effective);
  }, [effective]);

  return (
    <MapControlsBar testId="map-pills">
      <ColorByControl
        sport={props.session.sport}
        effective={effective}
        options={coloring.options}
        speedScale={coloring.speedScale}
      />
      <LapsControl records={props.records} laps={props.laps} sport={props.session.sport} />
    </MapControlsBar>
  );
};
