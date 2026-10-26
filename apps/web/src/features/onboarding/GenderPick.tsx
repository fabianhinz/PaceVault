import type { FC } from 'react';
import { User } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import type { Gender } from '@pacevault/engine/types.ts';
import { PvActionTile } from '@pacevault/ui/components/pvActionTile/PvActionTile.tsx';
import { PvHelperText } from '@pacevault/ui/components/pvHelperText/PvHelperText.tsx';
import { PvLabel } from '@pacevault/ui/components/pvLabel/PvLabel.tsx';
import type { ThresholdsForm } from '@/features/settings/hooks/useThresholdsForm.ts';
import { fieldId } from '@/features/onboarding/onboardingFields.ts';

const GENDERS: { id: Gender; label: () => string }[] = [
  { id: 'male', label: m.ui_thresholds_male },
  { id: 'female', label: m.ui_thresholds_female },
];

interface GenderPickProps {
  thresholds: ThresholdsForm;
}
export const GenderPick: FC<GenderPickProps> = (props) => {
  const error = props.thresholds.visibleError('gender');
  return (
    <div>
      <PvLabel id="onboarding-gender-label" required>
        {m.ui_thresholds_gender()}
      </PvLabel>
      <div
        role="radiogroup"
        aria-labelledby="onboarding-gender-label"
        aria-describedby="onboarding-gender-error"
        aria-invalid={error !== ''}
        className="flex flex-col gap-2"
      >
        {GENDERS.map((option, index) => (
          <PvActionTile
            key={option.id}
            icon={User}
            title={option.label()}
            selected={props.thresholds.form.gender === option.id}
            className={error === '' ? undefined : 'border-status-danger-strong'}
            buttonProps={{
              id: index === 0 ? fieldId('gender') : undefined,
              role: 'radio',
              'aria-checked': props.thresholds.form.gender === option.id,
            }}
            onClick={() => props.thresholds.setGender(option.id)}
          />
        ))}
      </div>
      <PvHelperText id="onboarding-gender-error" error={error !== ''}>
        {error}
      </PvHelperText>
    </div>
  );
};
