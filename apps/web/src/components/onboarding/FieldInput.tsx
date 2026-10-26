import type { FC } from 'react';
import { PvInput } from '@pacevault/ui/components/pvInput/PvInput.tsx';
import { PvLabel } from '@pacevault/ui/components/pvLabel/PvLabel.tsx';
import type { ThresholdsForm } from '@/components/settings/hooks/types.ts';
import type { TextField } from '@/components/settings/hooks/types.ts';
import { fieldId } from '@/components/onboarding/onboardingFields.ts';

interface FieldInputProps {
  thresholds: ThresholdsForm;
  field: TextField;
  label: string;
  hint: string;
  placeholder: string;
  inputMode: 'numeric' | 'decimal' | 'text';
  required?: boolean;
}

export const FieldInput: FC<FieldInputProps> = (props) => {
  const id = fieldId(props.field);
  const error = props.thresholds.visibleError(props.field);
  return (
    <div>
      <PvLabel htmlFor={id} required={props.required}>
        {props.label}
      </PvLabel>
      <PvInput
        id={id}
        type={props.inputMode === 'text' ? 'text' : 'number'}
        inputMode={props.inputMode}
        placeholder={props.placeholder}
        value={props.thresholds.form[props.field]}
        onChange={(e) => props.thresholds.setField({ field: props.field, value: e.target.value })}
        onBlur={() => props.thresholds.revealErrors([props.field])}
        helperText={error || props.hint}
        error={error !== ''}
        reserveHelper
      />
    </div>
  );
};
