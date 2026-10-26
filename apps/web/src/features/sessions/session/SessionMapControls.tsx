import type { FC } from 'react';
import { MapControlsBar } from '@/features/map/MapControlsBar.tsx';
import type { SessionLap, SessionRecord, TrainingSession } from '@pacevault/engine/types.ts';
import { ColorByControl } from './ColorByControl.tsx';
import { LapsControl } from './LapsControl.tsx';
import { MapViewControl } from './MapViewControl.tsx';
import { useSessionColorModes } from './hooks/useSessionColorModes.ts';
import { useTrackColorModeEffect } from './hooks/useTrackColorModeEffect.ts';

interface SessionMapControlsProps {
  session: TrainingSession;
  records: SessionRecord[];
  laps: SessionLap[];
}

export const SessionMapControls: FC<SessionMapControlsProps> = (props) => {
  const coloring = useSessionColorModes({ session: props.session, records: props.records });
  const effective = coloring.effective;

  useTrackColorModeEffect(effective);

  return (
    <MapControlsBar testId="map-pills">
      <MapViewControl />
      <ColorByControl
        sport={props.session.sport}
        effective={effective}
        options={coloring.options}
        speedScale={coloring.speedScale}
      />
      <LapsControl
        records={props.records}
        laps={props.laps}
        sport={props.session.sport}
        date={props.session.date}
      />
    </MapControlsBar>
  );
};
