import { useState, useMemo } from 'react';
import { parsePaceInput, formatPaceInput, parseTimeHMS, formatTimeHMS } from '@/lib/formatters.ts';
import {
  timeFromPaceAndDistance,
  paceFromDistanceAndTime,
  distanceFromPaceAndTime,
} from '@/packages/engine/paceCalculator.ts';

type Field = 'pace' | 'distance' | 'time';

export const usePaceCalculator = () => {
  const [paceInput, setPaceInput] = useState('');
  const [distanceInput, setDistanceInput] = useState('');
  const [timeInput, setTimeInput] = useState('');
  const [solveFor, setSolveFor] = useState<Field>('time');

  const computed = useMemo(() => {
    const pace = parsePaceInput(paceInput);
    let distance: number | undefined = undefined;
    if (distanceInput) {
      distance = Number(distanceInput) * 1000;
    }
    const time = parseTimeHMS(timeInput);

    if (solveFor === 'time' && pace !== undefined && distance !== undefined && distance > 0) {
      return { value: formatTimeHMS(timeFromPaceAndDistance(pace, distance)) };
    }
    if (solveFor === 'pace' && distance !== undefined && distance > 0 && time !== undefined) {
      return { value: formatPaceInput(paceFromDistanceAndTime(distance, time)) };
    }
    if (solveFor === 'distance' && pace !== undefined && pace > 0 && time !== undefined) {
      return { value: (distanceFromPaceAndTime(pace, time) / 1000).toFixed(2) };
    }
    return undefined;
  }, [paceInput, distanceInput, timeInput, solveFor]);

  return {
    paceInput,
    distanceInput,
    timeInput,
    computed,
    solveFor,
    setSolveFor,
    handlePaceChange: setPaceInput,
    handleDistanceChange: setDistanceInput,
    handleTimeChange: setTimeInput,
  };
};
