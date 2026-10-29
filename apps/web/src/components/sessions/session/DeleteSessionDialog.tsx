import type { ComponentProps, FC } from 'react';
import { usePageRouting } from '@/routing/usePageRouting.ts';
import { useQueryClient } from '@tanstack/react-query';
import { m } from '@pacevault/i18n/messages.js';
import { useSessionsStore } from '@/store/sessions.ts';
import { useTripsStore } from '@/store/trips.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { invalidatePersonalBestsOfSession } from '@/queries/records/usePersonalBests.ts';
import { useDeleteSessionMutation } from '@/mutations/sessions/useDeleteSessionMutation.ts';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { PvDialog } from '@pacevault/ui/components/pvDialog/PvDialog.tsx';
import { PvDialogContent } from '@pacevault/ui/components/pvDialog/PvDialogContent.tsx';
import { PvDialogHeader } from '@pacevault/ui/components/pvDialog/PvDialogHeader.tsx';
import { PvDialogBody } from '@pacevault/ui/components/pvDialog/PvDialogBody.tsx';
import { PvDialogFooter } from '@pacevault/ui/components/pvDialog/PvDialogFooter.tsx';
import { PvDialogDescription } from '@pacevault/ui/components/pvDialog/PvDialogDescription.tsx';
import { formatDate } from '@/lib/format/formatters.ts';
import type { TrainingSession } from '@pacevault/engine/types.ts';

interface DeleteSessionDialogProps extends Required<
  Pick<ComponentProps<typeof PvDialog>, 'open' | 'onOpenChange'>
> {
  session: TrainingSession;
}

export const DeleteSessionDialog: FC<DeleteSessionDialogProps> = (props) => {
  const pageRouting = usePageRouting();
  const queryClient = useQueryClient();
  const deleteSession = useDeleteSessionMutation();

  const handleDelete = async () => {
    useSessionsStore.getState().deleteSession(props.session.id);
    useTripsStore.getState().removeSessionFromAllTrips(props.session.id);
    void invalidatePersonalBestsOfSession(props.session.id, queryClient);
    props.onOpenChange(false);
    useMapFocusStore.getState().requestMapRefitAfterDelete();
    pageRouting.open({ page: 'sessions', params: {} });
    await deleteSession.mutateAsync({ sessionId: props.session.id });
  };

  return (
    <PvDialog
      open={props.open}
      onOpenChange={(open) => {
        if (!open) props.onOpenChange(false);
      }}
    >
      <PvDialogContent closeLabel={m.ui_sheet_drag_close()}>
        <PvDialogHeader title={m.ui_session_delete_title()} />
        <PvDialogBody>
          <PvDialogDescription>
            {m.ui_session_delete_desc({
              sport: props.session.sport,
              date: formatDate(props.session.date),
            })}
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
