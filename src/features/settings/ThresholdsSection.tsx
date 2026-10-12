import { useState } from 'react';
import { Info } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { formatPaceInput } from '@/lib/formatters.ts';
import { Input } from '@/components/ui/Input.tsx';
import { Label } from '@/components/ui/Label.tsx';
import { Card } from '@/components/ui/Card.tsx';
import { CardHeader } from '@/components/ui/CardHeader.tsx';
import { Button } from '@/components/ui/Button.tsx';
import {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/Select.tsx';
import { PaceEstimatorDialog } from './PaceEstimatorDialog.tsx';
import {
  useThresholdsForm,
  type NumberField,
  type ThresholdsForm,
} from './hooks/useThresholdsForm.ts';

const ThresholdsFields = (props: { thresholds: ThresholdsForm }) => {
  const thresholds = props.thresholds;
  const form = thresholds.form;
  const [estimatorOpen, setEstimatorOpen] = useState(false);

  const numberInput = (field: NumberField, id: string) => {
    const error = thresholds.visibleError(field);
    return (
      <Input
        id={id}
        type="number"
        value={form[field]}
        onChange={(e) => thresholds.setField(field, e.target.value)}
        helperText={error || undefined}
        error={!!error}
      />
    );
  };

  const paceError = thresholds.visibleError('thresholdPace');

  return (
    <>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label>{m.ui_thresholds_gender()}</Label>
            <SelectRoot value={form.gender} onValueChange={thresholds.setGender}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">{m.ui_thresholds_male()}</SelectItem>
                <SelectItem value="female">{m.ui_thresholds_female()}</SelectItem>
                <SelectItem value="other">{m.ui_thresholds_other()}</SelectItem>
              </SelectContent>
            </SelectRoot>
          </div>
          <div>
            <Label htmlFor="thresh-birthYear">{m.ui_thresholds_birth_year()}</Label>
            {numberInput('birthYear', 'thresh-birthYear')}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="thresh-restHr" required>
              {m.ui_thresholds_resting_hr()}
            </Label>
            {numberInput('restHr', 'thresh-restHr')}
          </div>
          <div>
            <Label htmlFor="thresh-maxHr" required>
              {m.ui_thresholds_max_hr()}
            </Label>
            {numberInput('maxHr', 'thresh-maxHr')}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="thresh-ftp">{m.ui_thresholds_ftp()}</Label>
            {numberInput('ftp', 'thresh-ftp')}
          </div>
          <div>
            <Label htmlFor="thresh-pace">{m.ui_thresholds_threshold_pace()}</Label>
            <Input
              id="thresh-pace"
              type="text"
              value={form.thresholdPace}
              onChange={(e) => thresholds.setField('thresholdPace', e.target.value)}
              helperText={
                paceError || (
                  <span className="flex gap-1 align-center text-accent">
                    <Info size={16} strokeWidth={1.5} className="shrink-0" />
                    <button
                      type="button"
                      className="cursor-pointer hover:underline"
                      onClick={() => setEstimatorOpen(true)}
                    >
                      {m.ui_thresholds_estimate_from_race()}
                    </button>
                  </span>
                )
              }
              error={!!paceError}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="thresh-weight">{m.ui_thresholds_weight()}</Label>
            {numberInput('weight', 'thresh-weight')}
          </div>
        </div>
      </div>

      <PaceEstimatorDialog
        open={estimatorOpen}
        onOpenChange={setEstimatorOpen}
        onSave={(paceSecPerKm) =>
          thresholds.setField('thresholdPace', formatPaceInput(paceSecPerKm))
        }
      />
    </>
  );
};

export const OnboardingThresholds = (props: { thresholds: ThresholdsForm }) => (
  <div>
    <ThresholdsFields thresholds={props.thresholds} />
    <p className="mt-3 text-xs text-text-quaternary">{m.ui_thresholds_onboarding_note()}</p>
  </div>
);

export const ThresholdsSection = () => {
  const thresholds = useThresholdsForm('update');

  return (
    <Card>
      <CardHeader title={m.ui_thresholds_title()} subtitle={m.ui_thresholds_subtitle()} />
      <ThresholdsFields thresholds={thresholds} />
      <div className="mt-4 flex justify-end">
        <Button disabled={!thresholds.dirty || !thresholds.valid} onClick={thresholds.save}>
          {m.ui_thresholds_save()}
        </Button>
      </div>
    </Card>
  );
};
