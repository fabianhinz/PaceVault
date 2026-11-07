import type { ComponentProps, FC } from 'react';
import { usePageRouting } from '@/routing/usePageRouting.ts';
import { useQueryClient } from '@tanstack/react-query';
import { m } from '@pacevault/i18n/messages.js';
import { useSessionsStore } from '@/store/sessions.ts';
import { useTripsStore } from '@/store/trips.ts';
import { useShallow } from 'zustand/react/shallow';
import { useSegmentsStore } from '@/store/segments.ts';
import { sessionSegmentsDeleteLabel } from '@/microcopy/segments.ts';
import { SegmentCompactItem } from '@/components/segments/SegmentCompactItem.tsx';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { invalidatePersonalBestsOfSession } from '@/queries/records/usePersonalBests.ts';
import { useDeleteSessionMutation } from '@/mutations/sessions/useDeleteSessionMutation.ts';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { PvDialog } from '@pacevault/ui/components/pvDialog/PvDialog.tsx';
import { PvDialogHeader } from '@pacevault/ui/components/pvDialog/PvDialogHeader.tsx';
import { PvDialogBody } from '@pacevault/ui/components/pvDialog/PvDialogBody.tsx';
import { PvDialogFooter } from '@pacevault/ui/components/pvDialog/PvDialogFooter.tsx';
import { PvDialogDescription } from '@pacevault/ui/components/pvDialog/PvDialogDescription.tsx';
import { PvActionItemList } from '@pacevault/ui/components/pvActionItem/PvActionItemList.tsx';
import { formatDate, formatDistance } from '@/lib/format/formatters.ts';
import { formatSessionName } from '@/components/sessions/sessionTitleFormatter.ts';
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
  const segments = useSegmentsStore(
    useShallow((s) =>
      s.segments.filter((segment) => segment.source.sessionId === props.session.id),
    ),
  );

  const handleDelete = async () => {
    useSessionsStore.getState().deleteSession(props.session.id);
    useTripsStore.getState().removeSessionFromAllTrips(props.session.id);
    const segmentIds = useSegmentsStore.getState().removeSegmentsOfSession(props.session.id);
    void invalidatePersonalBestsOfSession(props.session.id, queryClient);
    props.onOpenChange(false);
    useMapFocusStore.getState().requestMapRefitAfterDelete();
    pageRouting.open({ page: 'sessions', params: {} });
    await deleteSession.mutateAsync({ sessionId: props.session.id, segmentIds });
  };

  return (
    <PvDialog
      open={props.open}
      onOpenChange={(open) => {
        if (!open) props.onOpenChange(false);
      }}
      closeLabel={m.ui_sheet_drag_close()}
    >
      <PvDialogHeader title={m.ui_session_delete_title()} />
      <PvDialogBody>
        <PvDialogDescription>
          {m.ui_session_delete_desc({
            name: formatSessionName(props.session),
            date: formatDate(props.session.date),
          })}
        </PvDialogDescription>
        {segments.length > 0 && (
          <PvActionItemList size="sm" title={sessionSegmentsDeleteLabel(segments.length)}>
            {segments.map((segment) => (
              <SegmentCompactItem
                key={segment.id}
                segment={segment}
                value={formatDistance(segment.distanceMeters)}
              />
            ))}
          </PvActionItemList>
        )}
      </PvDialogBody>
      <PvDialogFooter>
        <PvButton variant="secondary" onClick={() => props.onOpenChange(false)}>
          {m.ui_btn_cancel()}
        </PvButton>
        <PvButton variant="danger" onClick={() => void handleDelete()}>
          {m.ui_btn_delete()}
        </PvButton>
      </PvDialogFooter>
    </PvDialog>
  );
};
