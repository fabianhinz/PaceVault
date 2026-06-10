import { useNavigate } from 'react-router-dom';
import { m } from '@/paraglide/messages.js';
import { useSessionsStore } from '@/store/sessions.ts';
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
  DialogTitle,
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

  return (
    <DialogRoot
      open={props.open}
      onOpenChange={(open) => {
        if (!open) props.onOpenChange(false);
      }}
    >
      <DialogContent>
        <DialogTitle>{m.ui_session_delete_title()}</DialogTitle>
        <DialogDescription>
          {m.ui_session_delete_desc({
            sport: props.session.sport,
            date: formatDate(props.session.date),
          })}
        </DialogDescription>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => props.onOpenChange(false)}>
            {m.ui_btn_cancel()}
          </Button>
          <Button
            className="bg-status-danger text-white hover:bg-status-danger/80"
            onClick={async () => {
              useSessionsStore.getState().deleteSession(props.session.id);
              props.onOpenChange(false);
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
        </div>
      </DialogContent>
    </DialogRoot>
  );
};
