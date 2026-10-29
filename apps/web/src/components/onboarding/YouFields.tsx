import type { FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import type { ThresholdsForm } from '@/components/settings/hooks/types.ts';
import { FieldInput } from '@/components/onboarding/FieldInput.tsx';
import { GenderPick } from '@/components/onboarding/GenderPick.tsx';

interface YouFieldsProps {
  thresholds: ThresholdsForm;
}

export const YouFields: FC<YouFieldsProps> = (props) => (
  <div className="grid grid-cols-1 gap-3">
    <GenderPick thresholds={props.thresholds} />
    <FieldInput
      thresholds={props.thresholds}
      field="restHr"
      label={m.ui_thresholds_resting_hr()}
      hint={m.ui_onboarding_rest_hr_hint()}
      placeholder="52"
      inputMode="numeric"
      required
    />
    <FieldInput
      thresholds={props.thresholds}
      field="maxHr"
      label={m.ui_thresholds_max_hr()}
      hint={m.ui_onboarding_max_hr_hint()}
      placeholder="186"
      inputMode="numeric"
      required
    />
    <FieldInput
      thresholds={props.thresholds}
      field="weight"
      label={m.ui_thresholds_weight()}
      hint={m.ui_onboarding_weight_hint()}
      placeholder="70"
      inputMode="decimal"
    />
    <FieldInput
      thresholds={props.thresholds}
      field="birthYear"
      label={m.ui_thresholds_birth_year()}
      hint={m.ui_onboarding_birth_year_hint()}
      placeholder="1990"
      inputMode="numeric"
    />
  </div>
);
