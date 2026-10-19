import { useState, type FormEvent, type ReactNode } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import type { ThresholdKey } from '@/store/user.ts';
import { formatPaceInput } from '@/lib/formatters.ts';
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
} from '@pacevault/ui/components/Dialog.tsx';
import { Button } from '@pacevault/ui/components/Button.tsx';
import { Input } from '@pacevault/ui/components/Input.tsx';
import { PaceEstimateButton } from './PaceEstimateButton.tsx';
import { PaceEstimatorDialog } from './PaceEstimatorDialog.tsx';
import { THRESHOLD_TILE_ICONS } from './thresholdIcons.ts';
import { fieldErrorFor, type ThresholdsForm } from './hooks/useThresholdsForm.ts';

interface ThresholdEditDialogProps {
  field: ThresholdKey | null;
  thresholds: ThresholdsForm;
  onConfirm: (field: ThresholdKey, value: string) => void;
  onClose: () => void;
}

const FIELD_TITLES: Record<ThresholdKey, () => string> = {
  restHr: m.ui_thresholds_resting_hr,
  maxHr: m.ui_thresholds_max_hr,
  ftp: m.ui_thresholds_ftp,
  thresholdPace: m.ui_thresholds_threshold_pace,
  weight: m.ui_thresholds_weight,
};

const ThresholdEditForm = (props: {
  field: ThresholdKey;
  thresholds: ThresholdsForm;
  onConfirm: (field: ThresholdKey, value: string) => void;
  onClose: () => void;
}) => {
  const initial = props.thresholds.current[props.field];
  const [draft, setDraft] = useState(initial);
  const [estimatorOpen, setEstimatorOpen] = useState(false);
  const title = FIELD_TITLES[props.field]();
  const error = fieldErrorFor(props.field, draft, props.thresholds.current);
  let visibleError = '';
  if (draft !== initial) visibleError = error;
  const canSave = draft.trim() !== '' && error === '';
  const isPace = props.field === 'thresholdPace';

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSave) return;
    props.onConfirm(props.field, draft);
  };

  let helperText: ReactNode = visibleError || undefined;
  if (isPace && visibleError === '') {
    helperText = <PaceEstimateButton onClick={() => setEstimatorOpen(true)} />;
  }

  return (
    <>
      <DialogHeader title={title} icon={THRESHOLD_TILE_ICONS[props.field]} />
      <form className="flex min-h-0 flex-col" onSubmit={handleSubmit}>
        <DialogBody>
          <div className="lg:mt-4">
            <Input
              data-threshold-input
              aria-label={title}
              type={isPace ? 'text' : 'number'}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              helperText={helperText}
              error={visibleError !== ''}
              reserveHelper
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={props.onClose}>
            {m.ui_btn_cancel()}
          </Button>
          <Button type="submit" disabled={!canSave}>
            {m.ui_btn_save()}
          </Button>
        </DialogFooter>
      </form>
      {isPace && (
        <PaceEstimatorDialog
          open={estimatorOpen}
          onOpenChange={setEstimatorOpen}
          onSave={(paceSecPerKm) => setDraft(formatPaceInput(paceSecPerKm))}
        />
      )}
    </>
  );
};

export const ThresholdEditDialog = (props: ThresholdEditDialogProps) => {
  const [shown, setShown] = useState(props.field);
  if (props.field !== null && props.field !== shown) setShown(props.field);

  return (
    <DialogRoot
      open={props.field !== null}
      onOpenChange={(open) => {
        if (!open) props.onClose();
      }}
    >
      <DialogContent
        aria-describedby={undefined}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          if (event.target instanceof HTMLElement) {
            event.target.querySelector<HTMLInputElement>('[data-threshold-input]')?.focus();
          }
        }}
      >
        {shown !== null && (
          <ThresholdEditForm
            key={shown}
            field={shown}
            thresholds={props.thresholds}
            onConfirm={props.onConfirm}
            onClose={props.onClose}
          />
        )}
      </DialogContent>
    </DialogRoot>
  );
};
