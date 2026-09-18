import {
  DialogRoot,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { m } from '@/paraglide/messages.js';

interface IntervalsImportAllDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  onConfirm: () => Promise<void>;
}

export const IntervalsImportAllDialog = (props: IntervalsImportAllDialogProps) => (
  <DialogRoot open={props.open} onOpenChange={props.onOpenChange}>
    <DialogContent>
      <DialogTitle>{m.ui_intervals_import_all_confirm_title()}</DialogTitle>
      <DialogDescription>
        {m.ui_intervals_import_all_confirm_desc({ count: props.count })}
      </DialogDescription>

      <div className="flex gap-3 justify-end pt-4">
        <Button type="button" variant="secondary" onClick={() => props.onOpenChange(false)}>
          {m.ui_btn_cancel()}
        </Button>
        <Button type="button" onClick={() => void props.onConfirm()}>
          {m.ui_intervals_import_submit({ count: props.count })}
        </Button>
      </div>
    </DialogContent>
  </DialogRoot>
);
