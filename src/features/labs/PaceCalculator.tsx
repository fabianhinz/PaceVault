import { m } from '@/paraglide/messages.js';
import { usePaceCalculator } from '@/features/labs/hooks/usePaceCalculator.ts';
import { Card } from '@/components/ui/Card.tsx';
import { CardHeader } from '@/components/ui/CardHeader.tsx';
import { Input } from '@/components/ui/Input.tsx';
import { Label } from '@/components/ui/Label.tsx';
import { SegmentedControl } from '@/components/ui/SegmentedControl.tsx';
const SOLVE_OPTIONS = [
  { value: 'pace', label: m.ui_labs_converter_pace_short() },
  { value: 'distance', label: m.ui_labs_converter_distance_short() },
  { value: 'time', label: m.ui_labs_converter_time_short() },
];

export const PaceCalculator = () => {
  const calc = usePaceCalculator();

  const displayValue = (field: 'pace' | 'distance' | 'time', rawInput: string) => {
    if (calc.computed && calc.solveFor === field) return calc.computed.value;
    return rawInput;
  };

  return (
    <Card>
      <CardHeader title={m.ui_labs_converter_title()} subtitle={m.ui_labs_converter_subtitle()} />

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <Label>{m.ui_labs_converter_solve_for()}</Label>
          <SegmentedControl
            value={calc.solveFor}
            onValueChange={(v) => calc.setSolveFor(v as 'pace' | 'distance' | 'time')}
            options={SOLVE_OPTIONS}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label>{m.ui_labs_converter_pace_short()}</Label>
            <Input
              type="text"
              placeholder="5:00"
              helperText="mm:ss /km"
              value={displayValue('pace', calc.paceInput)}
              onChange={(e) => calc.handlePaceChange(e.target.value)}
              disabled={calc.solveFor === 'pace'}
            />
          </div>

          <div>
            <Label>{m.ui_labs_converter_distance_short()}</Label>
            <Input
              type="text"
              placeholder="10"
              helperText="km"
              value={displayValue('distance', calc.distanceInput)}
              onChange={(e) => calc.handleDistanceChange(e.target.value)}
              disabled={calc.solveFor === 'distance'}
            />
          </div>

          <div>
            <Label>{m.ui_labs_converter_time_short()}</Label>
            <Input
              type="text"
              placeholder="0:50:00"
              helperText="hh:mm:ss"
              value={displayValue('time', calc.timeInput)}
              onChange={(e) => calc.handleTimeChange(e.target.value)}
              disabled={calc.solveFor === 'time'}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
