import { useMemo, type FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { PvSlider } from '@pacevault/ui/components/pvSlider/PvSlider.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { recordedDistance, splitDistanceRange } from '@/lib/laps.ts';
import { useMapPreferencesStore } from '@/store/mapPreferences.ts';
import type { SessionRecord, Sport } from '@pacevault/engine/types.ts';
import { splitDistanceLabel } from './lapLabels.ts';

interface SplitSliderProps {
  records: SessionRecord[];
  sport: Sport;
  value: number;
}

export const SplitSlider: FC<SplitSliderProps> = (props) => {
  const records = props.records;
  const sport = props.sport;
  const range = useMemo(
    () => splitDistanceRange({ sport, sessionMetres: recordedDistance(records) }),
    [sport, records],
  );
  const value = Math.min(range.max, Math.max(range.min, props.value));

  return (
    <div className="flex flex-col gap-1.5 pt-0.5 pr-2 pb-2.5 pl-10">
      <div className="flex items-baseline justify-between">
        <PvTypography variant="caption" color="textTertiary">
          {m.ui_laps_split_distance()}
        </PvTypography>
        <span data-testid="split-distance-value" className="text-sm font-medium tabular-nums">
          {splitDistanceLabel(props.value)}
        </span>
      </div>
      <PvSlider
        value={[value]}
        min={range.min}
        max={range.max}
        step={range.step}
        disabled={range.max <= range.min}
        aria-label={m.ui_laps_split_distance()}
        onValueChange={(next) => {
          const metres = next[0];
          if (metres !== undefined)
            useMapPreferencesStore
              .getState()
              .setSessionSplitDistance({ sport: props.sport, metres });
        }}
      />
      <div className="flex justify-between text-xs text-text-tertiary tabular-nums">
        <span>{splitDistanceLabel(range.min)}</span>
        <span>{splitDistanceLabel(range.max)}</span>
      </div>
    </div>
  );
};
