import { useState, useMemo } from 'react';
import type { RaceDistance } from '@/packages/engine/types.ts';
import { RACE_DISTANCE_METERS, calculateVdot, predictRaceTimes } from '@/packages/engine/vdot.ts';
import { parseRaceTime } from '@/lib/raceTime.ts';

export const useRacePredictor = () => {
  const [distance, setDistance] = useState<RaceDistance>('5k');
  const [timeInput, setTimeInput] = useState('');
  const result = useMemo(() => {
    const minutes = parseRaceTime(timeInput, distance);
    if (minutes === undefined) return undefined;

    const distMeters = RACE_DISTANCE_METERS[distance];
    const predictions = predictRaceTimes(distMeters, minutes * 60);
    if (!predictions) return undefined;

    const vdot = calculateVdot(distMeters, minutes);
    return { vdot, predictions };
  }, [distance, timeInput]);

  const handleDistanceChange = (v: string) => {
    if (!(v in RACE_DISTANCE_METERS)) return;
    setDistance(v as RaceDistance);
    setTimeInput('');
  };

  return {
    distance,
    timeInput,
    setTimeInput,
    handleDistanceChange,
    vdot: result?.vdot,
    predictions: result?.predictions,
  };
};
