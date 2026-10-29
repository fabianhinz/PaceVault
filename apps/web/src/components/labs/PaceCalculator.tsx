import type { FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { usePaceCalculator } from '@/components/labs/hooks/usePaceCalculator.ts';
import { PvCard } from '@pacevault/ui/components/pvCard/PvCard.tsx';
import { PvCardHeader } from '@pacevault/ui/components/pvCardHeader/PvCardHeader.tsx';
import { PvInput } from '@pacevault/ui/components/pvInput/PvInput.tsx';
import { PvLabel } from '@pacevault/ui/components/pvLabel/PvLabel.tsx';
import { PvSegmentedControl } from '@pacevault/ui/components/pvSegmentedControl/PvSegmentedControl.tsx';
const SOLVE_OPTIONS = [
  { value: 'pace', label: m.ui_labs_converter_pace_short() },
  { value: 'distance', label: m.ui_labs_converter_distance_short() },
  { value: 'time', label: m.ui_labs_converter_time_short() },
];

export const PaceCalculator: FC = () => {
  const calc = usePaceCalculator();

  const displayValue = ({
    field,
    rawInput,
  }: {
    field: 'pace' | 'distance' | 'time';
    rawInput: string;
  }) => {
    if (calc.computed && calc.solveFor === field) return calc.computed.value;
    return rawInput;
  };

  return (
    <PvCard>
      <PvCardHeader title={m.ui_labs_converter_title()} subtitle={m.ui_labs_converter_subtitle()} />

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <PvLabel>{m.ui_labs_converter_solve_for()}</PvLabel>
          <PvSegmentedControl
            aria-label={m.ui_labs_converter_solve_for()}
            value={calc.solveFor}
            onValueChange={(v) => calc.setSolveFor(v as 'pace' | 'distance' | 'time')}
            options={SOLVE_OPTIONS}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <PvLabel>{m.ui_labs_converter_pace_short()}</PvLabel>
            <PvInput
              type="text"
              placeholder="5:00"
              helperText="mm:ss /km"
              value={displayValue({ field: 'pace', rawInput: calc.paceInput })}
              onChange={(e) => calc.handlePaceChange(e.target.value)}
              disabled={calc.solveFor === 'pace'}
            />
          </div>

          <div>
            <PvLabel>{m.ui_labs_converter_distance_short()}</PvLabel>
            <PvInput
              type="text"
              placeholder="10"
              helperText="km"
              value={displayValue({ field: 'distance', rawInput: calc.distanceInput })}
              onChange={(e) => calc.handleDistanceChange(e.target.value)}
              disabled={calc.solveFor === 'distance'}
            />
          </div>

          <div>
            <PvLabel>{m.ui_labs_converter_time_short()}</PvLabel>
            <PvInput
              type="text"
              placeholder="0:50:00"
              helperText="hh:mm:ss"
              value={displayValue({ field: 'time', rawInput: calc.timeInput })}
              onChange={(e) => calc.handleTimeChange(e.target.value)}
              disabled={calc.solveFor === 'time'}
            />
          </div>
        </div>
      </div>
    </PvCard>
  );
};
