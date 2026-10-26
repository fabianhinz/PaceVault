import { useState, useMemo, type ComponentProps, type FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import type { RaceDistance } from '@pacevault/engine/types.ts';
import { METERS_BY_RACE_DISTANCE, thresholdPaceFromRace } from '@pacevault/engine/vdot.ts';
import { DISTANCE_OPTIONS, isLongFormat, parseRaceTime } from '@/lib/raceTime.ts';
import { PvDialog } from '@pacevault/ui/components/pvDialog/PvDialog.tsx';
import { PvDialogContent } from '@pacevault/ui/components/pvDialog/PvDialogContent.tsx';
import { PvDialogHeader } from '@pacevault/ui/components/pvDialog/PvDialogHeader.tsx';
import { PvDialogBody } from '@pacevault/ui/components/pvDialog/PvDialogBody.tsx';
import { PvDialogFooter } from '@pacevault/ui/components/pvDialog/PvDialogFooter.tsx';
import { PvDialogDescription } from '@pacevault/ui/components/pvDialog/PvDialogDescription.tsx';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { PvInput } from '@pacevault/ui/components/pvInput/PvInput.tsx';
import { PvLabel } from '@pacevault/ui/components/pvLabel/PvLabel.tsx';
import { PvSelect } from '@pacevault/ui/components/pvSelect/PvSelect.tsx';
import { PvSelectTrigger } from '@pacevault/ui/components/pvSelect/PvSelectTrigger.tsx';
import { PvSelectValue } from '@pacevault/ui/components/pvSelect/PvSelectValue.tsx';
import { PvSelectContent } from '@pacevault/ui/components/pvSelect/PvSelectContent.tsx';
import { PvSelectItem } from '@pacevault/ui/components/pvSelect/PvSelectItem.tsx';

interface PaceEstimatorDialogProps extends Required<
  Pick<ComponentProps<typeof PvDialog>, 'open' | 'onOpenChange'>
> {
  onSave: (paceSecPerKm: number) => void;
}

export const PaceEstimatorDialog: FC<PaceEstimatorDialogProps> = (props) => {
  const [distance, setDistance] = useState<RaceDistance>('5k');
  const [timeInput, setTimeInput] = useState('');

  const estimatedPace = useMemo(() => {
    const minutes = parseRaceTime({ input: timeInput, distance });
    if (minutes === undefined) return undefined;
    const pace = thresholdPaceFromRace({
      distanceMeters: METERS_BY_RACE_DISTANCE[distance],
      timeMin: minutes,
    });
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
    if (estimatedPace === undefined) return;
    props.onSave(estimatedPace);
    handleOpenChange(false);
  };

  return (
    <PvDialog open={props.open} onOpenChange={handleOpenChange}>
      <PvDialogContent closeLabel={m.ui_sheet_drag_close()}>
        <PvDialogHeader title={m.ui_pace_est_title()} />
        <PvDialogBody>
          <PvDialogDescription>{m.ui_pace_est_desc()}</PvDialogDescription>

          <div className="mt-4 flex flex-col gap-3">
            <div>
              <PvLabel>{m.ui_pace_est_distance()}</PvLabel>
              <PvSelect value={distance} onValueChange={handleDistanceChange}>
                <PvSelectTrigger>
                  <PvSelectValue />
                </PvSelectTrigger>
                <PvSelectContent>
                  {DISTANCE_OPTIONS.map((opt) => (
                    <PvSelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </PvSelectItem>
                  ))}
                </PvSelectContent>
              </PvSelect>
            </div>

            <div>
              <PvLabel>
                {m.ui_pace_est_race_time({
                  format: isLongFormat(distance) ? 'h:mm:ss' : 'mm:ss',
                })}
              </PvLabel>
              <PvInput
                type="text"
                placeholder={isLongFormat(distance) ? '1:45:00' : '20:00'}
                value={timeInput}
                onChange={(e) => setTimeInput(e.target.value)}
              />
            </div>
          </div>
        </PvDialogBody>

        <PvDialogFooter>
          <PvButton variant="secondary" onClick={() => handleOpenChange(false)}>
            {m.ui_btn_cancel()}
          </PvButton>
          <PvButton disabled={estimatedPace === undefined} onClick={handleSave}>
            {m.ui_btn_save()}
          </PvButton>
        </PvDialogFooter>
      </PvDialogContent>
    </PvDialog>
  );
};
