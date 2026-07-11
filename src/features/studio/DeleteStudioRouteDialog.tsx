import { m } from '@/paraglide/messages.js';
import { useStudioStore } from '@/store/studio.ts';
import { deleteStudioRoutePoints } from '@/lib/indexeddb.ts';
import { Button } from '@/components/ui/Button.tsx';
import {
  DialogRoot,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog.tsx';

export const DeleteStudioRouteDialog = (props: {
  routeId: string;
  routeName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}) => {
  const handleDelete = async () => {
    useStudioStore.getState().deleteStudioRoute(props.routeId);
    await deleteStudioRoutePoints(props.routeId).catch(() => undefined);
    props.onOpenChange(false);
    props.onDeleted?.();
  };

  return (
    <DialogRoot open={props.open} onOpenChange={() => props.onOpenChange(false)}>
      <DialogContent>
        <DialogTitle>{m.ui_studio_delete_title()}</DialogTitle>
        <DialogDescription>{m.ui_studio_delete_desc({ name: props.routeName })}</DialogDescription>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => props.onOpenChange(false)}>
            {m.ui_btn_cancel()}
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            {m.ui_btn_delete()}
          </Button>
        </div>
      </DialogContent>
    </DialogRoot>
  );
};
