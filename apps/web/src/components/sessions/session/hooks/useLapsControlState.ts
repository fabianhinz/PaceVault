import { useMemo } from 'react';
import {
  recordedDistance,
  effectiveSplitDistance,
  type LapSet,
  type LapSource,
} from '@/lib/analysis/laps.ts';
import { useMapControlsStore } from '@/store/mapControls.ts';
import { useMapPreferencesStore } from '@/store/mapPreferences.ts';
import type { SessionLap, SessionRecord, Sport } from '@pacevault/engine/types.ts';

interface LapsControlState {
  source: LapSource;
  splitDistance: number;
  sessionLaps: LapSet | null;
  selected: number | null;
  lapSelected: boolean;
}

export const useLapsControlState = ({
  records,
  laps,
  sport,
}: {
  records: SessionRecord[];
  laps: SessionLap[];
  sport: Sport;
}): LapsControlState => {
  const lapSource = useMapPreferencesStore((s) => s.bySport[sport].lapSource);
  const storedSplitDistance = useMapPreferencesStore((s) => s.bySport[sport].splitDistance);
  const sessionLaps = useMapControlsStore((s) => s.sessionLaps);
  const selected = useMapControlsStore((s) => s.selectedLapIndex);
  const sessionMetres = useMemo(() => recordedDistance(records), [records]);
  const splitDistance = effectiveSplitDistance({
    splitDistance: storedSplitDistance,
    sport,
    sessionMetres,
  });

  let source = lapSource;
  if (source === 'device' && laps.length === 0) {
    source = 'off';
  }

  const lapSelected =
    selected !== null &&
    sessionLaps !== null &&
    sessionLaps.bands.some((band) => band.lapIndex === selected);
  return { source, splitDistance, sessionLaps, selected, lapSelected };
};
