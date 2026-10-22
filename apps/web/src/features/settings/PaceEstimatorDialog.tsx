import { useState, useMemo } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import type { RaceDistance } from '@pacevault/engine/types.ts';
import { RACE_DISTANCE_METERS, thresholdPaceFromRace } from '@pacevault/engine/vdot.ts';
import { DISTANCE_OPTIONS, usesLongFormat, parseRaceTime } from '@/lib/raceTime.ts';
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogDescription,
} from '@pacevault/ui/components/Dialog.tsx';
import { Button } from '@pacevault/ui/components/Button.tsx';
import { Input } from '@pacevault/ui/components/Input.tsx';
import { Label } from '@pacevault/ui/components/Label.tsx';
import {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@pacevault/ui/components/Select.tsx';

interface PaceEstimatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (paceSecPerKm: number) => void;
}

export const PaceEstimatorDialog = (props: PaceEstimatorDialogProps) => {
  const [distance, setDistance] = useState<RaceDistance>('5k');
  const [timeInput, setTimeInput] = useState('');

  const result = useMemo(() => {
    const minutes = parseRaceTime(timeInput, distance);
    if (minutes === undefined) return undefined;
    const pace = thresholdPaceFromRace(RACE_DISTANCE_METERS[distance], minutes);
    if (pace < 150 || pace > 540) return undefined;
    return pace;
  }, [timeInput, distance]);

  const handleDistanceChange = (v: string) => {
    setDistance(v as RaceDistance);
    setTimeInput('');
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setDistance('5k');
      setTimeInput('');
    }
    props.onOpenChange(open);
  };

  const handleSave = () => {
    if (result === undefined) return;
    props.onSave(result);
    handleOpenChange(false);
  };

  return (
    <DialogRoot open={props.open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader title={m.ui_pace_est_title()} />
        <DialogBody>
          <DialogDescription>{m.ui_pace_est_desc()}</DialogDescription>

          <div className="mt-4 flex flex-col gap-3">
            <div>
              <Label>{m.ui_pace_est_distance()}</Label>
              <SelectRoot value={distance} onValueChange={handleDistanceChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISTANCE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectRoot>
            </div>

            <div>
              <Label>
                {m.ui_pace_est_race_time({
                  format: usesLongFormat(distance) ? 'h:mm:ss' : 'mm:ss',
                })}
              </Label>
              <Input
                type="text"
                placeholder={usesLongFormat(distance) ? '1:45:00' : '20:00'}
                value={timeInput}
                onChange={(e) => setTimeInput(e.target.value)}
              />
            </div>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="secondary" onClick={() => handleOpenChange(false)}>
            {m.ui_btn_cancel()}
          </Button>
          <Button disabled={result === undefined} onClick={handleSave}>
            {m.ui_btn_save()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
};
