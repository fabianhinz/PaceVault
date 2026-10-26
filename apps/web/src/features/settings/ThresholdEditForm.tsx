import { useState, type FormEvent, type ReactNode, type FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import type { ThresholdKey } from '@/store/user.ts';
import { formatPaceInput } from '@/lib/formatters.ts';
import { PvDialogHeader } from '@pacevault/ui/components/pvDialog/PvDialogHeader.tsx';
import { PvDialogBody } from '@pacevault/ui/components/pvDialog/PvDialogBody.tsx';
import { PvDialogFooter } from '@pacevault/ui/components/pvDialog/PvDialogFooter.tsx';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { PvInput } from '@pacevault/ui/components/pvInput/PvInput.tsx';
import { PaceEstimateButton } from './PaceEstimateButton.tsx';
import { PaceEstimatorDialog } from './PaceEstimatorDialog.tsx';
import { THRESHOLD_TILE_ICONS } from './thresholdIcons.ts';
import type { ThresholdsForm } from './hooks/useThresholdsForm.ts';
import { useThresholdDraft } from './hooks/useThresholdDraft.ts';
import { TITLE_BY_THRESHOLD_FIELD } from '@/microcopy/thresholds.ts';

interface ThresholdEditFormProps {
  field: ThresholdKey;
  thresholds: ThresholdsForm;
  onConfirm: ({ field, value }: { field: ThresholdKey; value: string }) => void;
  onClose: () => void;
}

export const ThresholdEditForm: FC<ThresholdEditFormProps> = (props) => {
  const thresholdDraft = useThresholdDraft({ field: props.field, thresholds: props.thresholds });
  const [estimatorOpen, setEstimatorOpen] = useState(false);
  const title = TITLE_BY_THRESHOLD_FIELD[props.field]();
  const paceField = props.field === 'thresholdPace';

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!thresholdDraft.canSave) return;
    props.onConfirm({ field: props.field, value: thresholdDraft.draft });
  };

  let helperText: ReactNode = thresholdDraft.visibleError || undefined;
  if (paceField && thresholdDraft.visibleError === '') {
    helperText = <PaceEstimateButton onClick={() => setEstimatorOpen(true)} />;
  }

  return (
    <>
      <PvDialogHeader title={title} icon={THRESHOLD_TILE_ICONS[props.field]} />
      <form className="flex min-h-0 flex-col" onSubmit={handleSubmit}>
        <PvDialogBody>
          <div className="lg:mt-4">
            <PvInput
              data-threshold-input
              aria-label={title}
              type={paceField ? 'text' : 'number'}
              value={thresholdDraft.draft}
              onChange={(e) => thresholdDraft.setDraft(e.target.value)}
              helperText={helperText}
              error={thresholdDraft.visibleError !== ''}
              reserveHelper
            />
          </div>
        </PvDialogBody>
        <PvDialogFooter>
          <PvButton type="button" variant="secondary" onClick={props.onClose}>
            {m.ui_btn_cancel()}
          </PvButton>
          <PvButton type="submit" disabled={!thresholdDraft.canSave}>
            {m.ui_btn_save()}
          </PvButton>
        </PvDialogFooter>
      </form>
      {paceField && (
        <PaceEstimatorDialog
          open={estimatorOpen}
          onOpenChange={setEstimatorOpen}
          onSave={(paceSecPerKm) => thresholdDraft.setDraft(formatPaceInput(paceSecPerKm))}
        />
      )}
    </>
  );
};
