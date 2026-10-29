import { useState, type FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { formatPaceInput } from '@/lib/format/formatters.ts';
import { PaceEstimateButton } from '@/components/settings/PaceEstimateButton.tsx';
import { PaceEstimatorDialog } from '@/components/settings/PaceEstimatorDialog.tsx';
import type { ThresholdsForm } from '@/components/settings/hooks/types.ts';
import { FieldInput } from '@/components/onboarding/FieldInput.tsx';

interface ThresholdFieldsProps {
  thresholds: ThresholdsForm;
}

export const ThresholdFields: FC<ThresholdFieldsProps> = (props) => {
  const [estimatorOpen, setEstimatorOpen] = useState(false);
  return (
    <div className="grid grid-cols-1 gap-3">
      <FieldInput
        thresholds={props.thresholds}
        field="ftp"
        label={m.ui_thresholds_ftp()}
        hint={m.ui_onboarding_ftp_hint()}
        placeholder="240"
        inputMode="numeric"
      />
      <div className="flex flex-col gap-1">
        <FieldInput
          thresholds={props.thresholds}
          field="thresholdPace"
          label={m.ui_thresholds_threshold_pace()}
          hint={m.ui_onboarding_pace_hint()}
          placeholder="4:30"
          inputMode="text"
        />
        <div className="text-xs">
          <PaceEstimateButton onClick={() => setEstimatorOpen(true)} />
        </div>
      </div>
      <PaceEstimatorDialog
        open={estimatorOpen}
        onOpenChange={setEstimatorOpen}
        onSave={(paceSecPerKm) =>
          props.thresholds.setField({
            field: 'thresholdPace',
            value: formatPaceInput(paceSecPerKm),
          })
        }
      />
      <FieldInput
        thresholds={props.thresholds}
        field="thresholdHr"
        label={m.ui_thresholds_threshold_hr()}
        hint={m.ui_onboarding_threshold_hr_hint()}
        placeholder="165"
        inputMode="numeric"
      />
    </div>
  );
};
