import { useState, type FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import type { ThresholdKey } from '@/store/user.ts';
import { PvDialog } from '@pacevault/ui/components/pvDialog/PvDialog.tsx';
import { PvDialogContent } from '@pacevault/ui/components/pvDialog/PvDialogContent.tsx';
import type { ThresholdsForm } from './hooks/useThresholdsForm.ts';
import { ThresholdEditForm } from './ThresholdEditForm.tsx';

interface ThresholdEditDialogProps {
  field: ThresholdKey | null;
  thresholds: ThresholdsForm;
  onConfirm: ({ field, value }: { field: ThresholdKey; value: string }) => void;
  onClose: () => void;
}

export const ThresholdEditDialog: FC<ThresholdEditDialogProps> = (props) => {
  const [shown, setShown] = useState(props.field);
  if (props.field !== null && props.field !== shown) setShown(props.field);

  return (
    <PvDialog
      open={props.field !== null}
      onOpenChange={(open) => {
        if (!open) props.onClose();
      }}
    >
      <PvDialogContent
        closeLabel={m.ui_sheet_drag_close()}
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
      </PvDialogContent>
    </PvDialog>
  );
};
