import type { FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { PvInput } from '@pacevault/ui/components/pvInput/PvInput.tsx';
import { PvLabel } from '@pacevault/ui/components/pvLabel/PvLabel.tsx';
import { PvSelect } from '@pacevault/ui/components/pvSelect/PvSelect.tsx';
import { PvSelectTrigger } from '@pacevault/ui/components/pvSelect/PvSelectTrigger.tsx';
import { PvSelectValue } from '@pacevault/ui/components/pvSelect/PvSelectValue.tsx';
import { PvSelectContent } from '@pacevault/ui/components/pvSelect/PvSelectContent.tsx';
import { PvSelectItem } from '@pacevault/ui/components/pvSelect/PvSelectItem.tsx';
import type { ThresholdsForm } from './hooks/useThresholdsForm.ts';

interface ProfileFieldsProps {
  thresholds: ThresholdsForm;
}

export const ProfileFields: FC<ProfileFieldsProps> = (props) => {
  const thresholds = props.thresholds;
  const birthYearError = thresholds.visibleError('birthYear');
  return (
    <>
      <div>
        <PvLabel>{m.ui_thresholds_gender()}</PvLabel>
        <PvSelect value={thresholds.form.gender ?? undefined} onValueChange={thresholds.setGender}>
          <PvSelectTrigger>
            <PvSelectValue />
          </PvSelectTrigger>
          <PvSelectContent>
            <PvSelectItem value="male">{m.ui_thresholds_male()}</PvSelectItem>
            <PvSelectItem value="female">{m.ui_thresholds_female()}</PvSelectItem>
          </PvSelectContent>
        </PvSelect>
      </div>
      <div>
        <PvLabel htmlFor="thresh-birthYear">{m.ui_thresholds_birth_year()}</PvLabel>
        <PvInput
          id="thresh-birthYear"
          type="number"
          value={thresholds.form.birthYear}
          onChange={(e) => thresholds.setField({ field: 'birthYear', value: e.target.value })}
          onBlur={() => thresholds.revealErrors(['birthYear'])}
          helperText={birthYearError}
          error={birthYearError !== ''}
          reserveHelper
        />
      </div>
    </>
  );
};
