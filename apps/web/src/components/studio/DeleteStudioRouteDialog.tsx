import type { ComponentProps, FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { useStudioStore } from '@/store/studio.ts';
import { useDeleteStudioRouteMutation } from '@/mutations/studio/useDeleteStudioRouteMutation.ts';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { PvDialog } from '@pacevault/ui/components/pvDialog/PvDialog.tsx';
import { PvDialogContent } from '@pacevault/ui/components/pvDialog/PvDialogContent.tsx';
import { PvDialogHeader } from '@pacevault/ui/components/pvDialog/PvDialogHeader.tsx';
import { PvDialogBody } from '@pacevault/ui/components/pvDialog/PvDialogBody.tsx';
import { PvDialogFooter } from '@pacevault/ui/components/pvDialog/PvDialogFooter.tsx';
import { PvDialogDescription } from '@pacevault/ui/components/pvDialog/PvDialogDescription.tsx';

interface DeleteStudioRouteDialogProps extends Required<
  Pick<ComponentProps<typeof PvDialog>, 'open' | 'onOpenChange'>
> {
  routeId: string;
  routeName: string;
  onDeleted?: () => void;
}

export const DeleteStudioRouteDialog: FC<DeleteStudioRouteDialogProps> = (props) => {
  const deleteStudioRoute = useDeleteStudioRouteMutation();

  const handleDelete = async () => {
    useStudioStore.getState().deleteStudioRoute(props.routeId);
    await deleteStudioRoute.mutateAsync({ routeId: props.routeId }).catch(() => undefined);
    props.onOpenChange(false);
    props.onDeleted?.();
  };

  return (
    <PvDialog open={props.open} onOpenChange={() => props.onOpenChange(false)}>
      <PvDialogContent closeLabel={m.ui_sheet_drag_close()}>
        <PvDialogHeader title={m.ui_studio_delete_title()} />
        <PvDialogBody>
          <PvDialogDescription>
            {m.ui_studio_delete_desc({ name: props.routeName })}
          </PvDialogDescription>
        </PvDialogBody>
        <PvDialogFooter>
          <PvButton variant="secondary" onClick={() => props.onOpenChange(false)}>
            {m.ui_btn_cancel()}
          </PvButton>
          <PvButton variant="danger" onClick={() => void handleDelete()}>
            {m.ui_btn_delete()}
          </PvButton>
        </PvDialogFooter>
      </PvDialogContent>
    </PvDialog>
  );
};
