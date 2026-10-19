import { m } from '@pacevault/i18n/messages.js';
import { useStudioStore } from '@/store/studio.ts';
import { deleteStudioRoutePoints } from '@/lib/indexeddb.ts';
import { Button } from '@pacevault/ui/components/Button.tsx';
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogDescription,
} from '@pacevault/ui/components/Dialog.tsx';

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
        <DialogHeader title={m.ui_studio_delete_title()} />
        <DialogBody>
          <DialogDescription>
            {m.ui_studio_delete_desc({ name: props.routeName })}
          </DialogDescription>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => props.onOpenChange(false)}>
            {m.ui_btn_cancel()}
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            {m.ui_btn_delete()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
};
