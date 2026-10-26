import { useDeferredValue, type FC } from 'react';
import { PvCollapsibleListItem } from '@pacevault/ui/components/pvCollapsibleListItem/PvCollapsibleListItem.tsx';
import type { LapSet } from '@/lib/laps.ts';
import { useMapControlsStore } from '@/store/mapControls.ts';
import { useMapPreferencesStore } from '@/store/mapPreferences.ts';
import type { SessionLap, Sport } from '@pacevault/engine/types.ts';
import { LapStrip } from './LapStrip.tsx';
import { LapsDetails } from './LapsDetails.tsx';
import { lapsRowLabels } from './lapLabels.ts';

interface LapsRowProps {
  laps: SessionLap[];
  sport: Sport;
}

export const LapsRow: FC<LapsRowProps> = (props) => {
  const lapSource = useMapPreferencesStore((s) => s.bySport[props.sport].lapSource);
  const sessionLaps = useDeferredValue(useMapControlsStore((s) => s.sessionLaps));

  let source = lapSource;
  if (source === 'device' && props.laps.length === 0) source = 'off';
  let set: LapSet | null = null;
  if (source !== 'off') set = sessionLaps;

  const labels = lapsRowLabels({ source, set, sport: props.sport });

  return (
    <PvCollapsibleListItem
      testId="laps-row"
      disabled={labels.disabled || set === null}
      avatar={<LapStrip set={set} size="avatar" />}
      primary={labels.primary}
      secondary={labels.secondary === '' ? undefined : labels.secondary}
    >
      {set !== null && <LapsDetails set={set} sport={props.sport} source={source} />}
    </PvCollapsibleListItem>
  );
};
