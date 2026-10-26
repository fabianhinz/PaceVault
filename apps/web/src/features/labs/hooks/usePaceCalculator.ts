import { useState, useMemo } from 'react';
import { parsePaceInput, formatPaceInput, parseTimeHMS, formatTimeHMS } from '@/lib/formatters.ts';
import {
  timeFromPaceAndDistance,
  paceFromDistanceAndTime,
  distanceFromPaceAndTime,
} from '@pacevault/engine/paceCalculator.ts';

type Field = 'pace' | 'distance' | 'time';

interface PaceCalculatorForm {
  paceInput: string;
  distanceInput: string;
  timeInput: string;
  computed: { value: string } | undefined;
  solveFor: Field;
  setSolveFor: (field: Field) => void;
  handlePaceChange: (value: string) => void;
  handleDistanceChange: (value: string) => void;
  handleTimeChange: (value: string) => void;
}

export const usePaceCalculator = (): PaceCalculatorForm => {
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
      return {
        value: formatTimeHMS(
          timeFromPaceAndDistance({ paceSecPerKm: pace, distanceMeters: distance }),
        ),
      };
    }
    if (solveFor === 'pace' && distance !== undefined && distance > 0 && time !== undefined) {
      return {
        value: formatPaceInput(
          paceFromDistanceAndTime({ distanceMeters: distance, timeSec: time }),
        ),
      };
    }
    if (solveFor === 'distance' && pace !== undefined && pace > 0 && time !== undefined) {
      return {
        value: (distanceFromPaceAndTime({ paceSecPerKm: pace, timeSec: time }) / 1000).toFixed(2),
      };
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
