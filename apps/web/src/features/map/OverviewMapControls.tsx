import type { FC } from 'react';
import { useMapControlsStore } from '@/store/mapControls.ts';
import { MapControlsBar } from './MapControlsBar.tsx';
import { TrackIntensityControl } from './TrackIntensityControl.tsx';

export const OverviewMapControls: FC = () => {
  const shown = useMapControlsStore((s) => s.overviewMapControlsShown);

  if (!shown) return null;

  return (
    <MapControlsBar testId="overview-map-pills">
      <TrackIntensityControl />
    </MapControlsBar>
  );
};
