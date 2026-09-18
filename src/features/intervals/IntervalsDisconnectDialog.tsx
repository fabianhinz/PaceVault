import {
  DialogRoot,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { m } from '@/paraglide/messages.js';

interface IntervalsDisconnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export const IntervalsDisconnectDialog = (props: IntervalsDisconnectDialogProps) => (
  <DialogRoot open={props.open} onOpenChange={props.onOpenChange}>
    <DialogContent>
      <DialogTitle>{m.ui_intervals_disconnect_title()}</DialogTitle>
      <DialogDescription>{m.ui_intervals_disconnect_desc()}</DialogDescription>

      <div className="flex gap-3 justify-end pt-4">
        <Button type="button" variant="secondary" onClick={() => props.onOpenChange(false)}>
          {m.ui_btn_cancel()}
        </Button>
        <Button type="button" variant="danger" onClick={props.onConfirm}>
          {m.ui_intervals_disconnect_confirm()}
        </Button>
      </div>
    </DialogContent>
  </DialogRoot>
);
