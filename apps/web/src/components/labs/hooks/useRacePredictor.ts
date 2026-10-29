import { useState, useMemo } from 'react';
import type { RaceDistance } from '@pacevault/engine/types.ts';
import { METERS_BY_RACE_DISTANCE, vdotFromRace, predictRaceTimes } from '@pacevault/engine/vdot.ts';
import { parseRaceTime } from '@/components/labs/raceTime.ts';

interface RacePredictorForm {
  distance: RaceDistance;
  timeInput: string;
  setTimeInput: (value: string) => void;
  handleDistanceChange: (value: string) => void;
  vdot: number | undefined;
  predictions: ReturnType<typeof predictRaceTimes>;
}

export const useRacePredictor = (): RacePredictorForm => {
  const [distance, setDistance] = useState<RaceDistance>('5k');
  const [timeInput, setTimeInput] = useState('');
  const prediction = useMemo(() => {
    const minutes = parseRaceTime({ input: timeInput, distance });
    if (minutes === undefined) return undefined;

    const distMeters = METERS_BY_RACE_DISTANCE[distance];
    const predictions = predictRaceTimes({ distanceMeters: distMeters, timeSec: minutes * 60 });
    if (!predictions) return undefined;

    const vdot = vdotFromRace({ distanceMeters: distMeters, timeMin: minutes });
    return { vdot, predictions };
  }, [distance, timeInput]);

  const handleDistanceChange = (v: string) => {
    if (!(v in METERS_BY_RACE_DISTANCE)) return;
    setDistance(v as RaceDistance);
    setTimeInput('');
  };

  return {
    distance,
    timeInput,
    setTimeInput,
    handleDistanceChange,
    vdot: prediction?.vdot,
    predictions: prediction?.predictions,
  };
};
