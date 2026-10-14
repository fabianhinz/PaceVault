import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { m } from '@/paraglide/messages.js';
import { useSessionsStore } from '@/store/sessions.ts';
import { useTripsStore } from '@/store/trips.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { invalidatePersonalBestsOfSession } from '@/features/records/hooks/usePersonalBests.ts';
import {
  deleteSessionRecords,
  deleteSessionLaps,
  deleteSessionGPS,
  deleteFitFile,
} from '@/lib/indexeddb.ts';
import { deleteSessionWeather } from '@/lib/weatherDb.ts';
import { Button } from '@/components/ui/Button.tsx';
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/Dialog.tsx';
import { formatDate } from '@/lib/formatters.ts';
import type { TrainingSession } from '@/packages/engine/types.ts';

export const DeleteSessionDialog = (props: {
  session: TrainingSession;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return (
    <DialogRoot
      open={props.open}
      onOpenChange={(open) => {
        if (!open) props.onOpenChange(false);
      }}
    >
      <DialogContent>
        <DialogHeader title={m.ui_session_delete_title()} />
        <DialogBody>
          <DialogDescription>
            {m.ui_session_delete_desc({
              sport: props.session.sport,
              date: formatDate(props.session.date),
            })}
          </DialogDescription>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => props.onOpenChange(false)}>
            {m.ui_btn_cancel()}
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              useSessionsStore.getState().deleteSession(props.session.id);
              useTripsStore.getState().removeSessionFromAllTrips(props.session.id);
              invalidatePersonalBestsOfSession(queryClient, props.session.id);
              props.onOpenChange(false);
              useMapFocusStore.getState().requestMapRefitAfterDelete();
              navigate('/sessions');
              await Promise.all([
                deleteSessionRecords(props.session.id),
                deleteSessionLaps(props.session.id),
                deleteSessionGPS(props.session.id),
                deleteSessionWeather(props.session.id),
                deleteFitFile(props.session.id),
              ]);
            }}
          >
            {m.ui_btn_delete()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
};
