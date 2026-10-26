import type { FC } from 'react';
import type { LapAnalysis, LapSet, LapSource } from '@/lib/laps.ts';
import type { Sport } from '@pacevault/engine/types.ts';
import { KeyValue } from './KeyValue.tsx';
import { lapName, lapPaceLabel } from './lapLabels.ts';

interface LapExtremeProps {
  set: LapSet;
  label: string;
  lap: LapAnalysis | undefined;
  sport: Sport;
  source: LapSource;
}

export const LapExtreme: FC<LapExtremeProps> = (props) => {
  const pace = props.lap?.paceSecPerKm;
  if (props.lap === undefined || pace === undefined) return null;
  return (
    <KeyValue
      label={props.label}
      value={lapPaceLabel({ secPerKm: pace, sport: props.sport })}
      detail={lapName({
        set: props.set,
        lapIndex: props.lap.lapIndex,
        source: props.source,
        sport: props.sport,
      })}
    />
  );
};
