import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { m } from '@/paraglide/messages.js';
import {
  DialogRoot,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { Typography } from '@/components/ui/Typography.tsx';
import { toast } from '@/components/ui/toastStore.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { useTripsStore } from '@/store/trips.ts';
import { useStudioStore } from '@/store/studio.ts';
import { useUserStore } from '@/store/user.ts';
import { useCoachPlanStore } from '@/store/coachPlan.ts';
import { useLayoutStore } from '@/store/layout.ts';
import { useFiltersStore } from '@/store/filters.ts';
import { createEmptyAttributeFilters } from '@/lib/attributeFilters.ts';
import { clearAllRecords } from '@/lib/indexeddb.ts';
interface DeleteAllDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeleteAllDataDialog = (props: DeleteAllDataDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const sessionCount = useSessionsStore((s) => s.sessions.length);
  const hasProfile = useUserStore((s) => s.profile !== null);
  const navigate = useNavigate();

  const handleDelete = async () => {
    setIsDeleting(true);
    useSessionsStore.getState().clearAll();
    useTripsStore.getState().clearAll();
    useStudioStore.getState().clearAll();
    useUserStore.getState().resetProfile();
    useCoachPlanStore.getState().clearPlan();
    useLayoutStore.setState({ onboardingComplete: false, demoMode: false });
    useFiltersStore.setState({
      timeRange: 'all',
      customRange: null,
      prevDashboardRange: null,
      sportFilter: 'all',
      attributeFilters: createEmptyAttributeFilters(),
    });
    await clearAllRecords();
    setIsDeleting(false);
    props.onOpenChange(false);
    toast(m.ui_delete_dialog_toast(), undefined, 'success');
    navigate('/');
  };

  const handleOpenChange = (open: boolean) => {
    if (isDeleting) return;
    props.onOpenChange(open);
  };

  return (
    <DialogRoot open={props.open} onOpenChange={handleOpenChange}>
      <DialogContent
        onEscapeKeyDown={(e) => {
          if (isDeleting) e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          if (isDeleting) e.preventDefault();
        }}
      >
        <DialogTitle>{m.ui_delete_dialog_title()}</DialogTitle>
        <DialogDescription>{m.ui_delete_dialog_desc()}</DialogDescription>

        <div className="mt-4">
          <Typography variant="body1" color="textSecondary">
            {m.ui_delete_dialog_count({
              summary:
                (sessionCount === 1
                  ? m.ui_count_sessions_one()
                  : m.ui_count_sessions_other({ count: String(sessionCount) })) +
                (hasProfile ? ` ${m.ui_delete_dialog_and_profile()}` : ''),
            })}
          </Typography>
        </div>

        <div className="flex gap-3 justify-end pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => props.onOpenChange(false)}
            disabled={isDeleting}
          >
            {m.ui_btn_cancel()}
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
            loading={isDeleting}
            aria-label={m.ui_delete_dialog_confirm()}
          >
            {isDeleting ? m.ui_delete_dialog_deleting() : m.ui_delete_dialog_confirm()}
          </Button>
        </div>
      </DialogContent>
    </DialogRoot>
  );
};
