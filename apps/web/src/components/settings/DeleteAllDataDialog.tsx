import type { ComponentProps, FC } from 'react';
import { usePageRouting } from '@/routing/usePageRouting.ts';
import { useQueryClient } from '@tanstack/react-query';
import { m } from '@pacevault/i18n/messages.js';
import { PvDialog } from '@pacevault/ui/components/pvDialog/PvDialog.tsx';
import { PvDialogContent } from '@pacevault/ui/components/pvDialog/PvDialogContent.tsx';
import { PvDialogHeader } from '@pacevault/ui/components/pvDialog/PvDialogHeader.tsx';
import { PvDialogBody } from '@pacevault/ui/components/pvDialog/PvDialogBody.tsx';
import { PvDialogFooter } from '@pacevault/ui/components/pvDialog/PvDialogFooter.tsx';
import { PvDialogDescription } from '@pacevault/ui/components/pvDialog/PvDialogDescription.tsx';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { formatPlural } from '@/lib/format/formatters.ts';
import { useSnackbar } from '@/lib/hooks/useSnackbar.ts';
import { SETTINGS_SNACKBARS } from '@/components/settings/settingsSnackbars.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { useUserStore } from '@/store/user.ts';
import { useClearAllDataMutation } from '@/mutations/settings/useClearAllDataMutation.ts';
import { clearAllAppState } from '@/components/settings/deleteAllData.ts';

interface DeleteAllDataDialogProps extends Required<
  Pick<ComponentProps<typeof PvDialog>, 'open' | 'onOpenChange'>
> {}

export const DeleteAllDataDialog: FC<DeleteAllDataDialogProps> = (props) => {
  const clearAllData = useClearAllDataMutation();
  const sessionCount = useSessionsStore((s) => s.sessions.length);
  const profilePresent = useUserStore((s) => s.profile !== null);
  const pageRouting = usePageRouting();
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();

  const handleDelete = async () => {
    clearAllAppState(queryClient);
    await clearAllData.mutateAsync();
    props.onOpenChange(false);
    snackbar.enqueueSnackbar(SETTINGS_SNACKBARS.allDataDeleted);
    pageRouting.open({ page: 'dashboard', params: {} });
  };

  const handleOpenChange = (open: boolean) => {
    if (clearAllData.isPending) return;
    props.onOpenChange(open);
  };

  return (
    <PvDialog open={props.open} onOpenChange={handleOpenChange}>
      <PvDialogContent
        closeLabel={m.ui_sheet_drag_close()}
        onEscapeKeyDown={(e) => {
          if (clearAllData.isPending) e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          if (clearAllData.isPending) e.preventDefault();
        }}
      >
        <PvDialogHeader title={m.ui_delete_dialog_title()} />
        <PvDialogBody>
          <PvDialogDescription>{m.ui_delete_dialog_desc()}</PvDialogDescription>

          <div className="mt-4">
            <PvTypography variant="body1" color="textSecondary">
              {m.ui_delete_dialog_count({
                summary:
                  formatPlural(sessionCount, {
                    one: () => m.ui_count_sessions_one(),
                    other: () => m.ui_count_sessions_other({ count: String(sessionCount) }),
                  }) + (profilePresent ? ` ${m.ui_delete_dialog_and_profile()}` : ''),
              })}
            </PvTypography>
          </div>
        </PvDialogBody>

        <PvDialogFooter>
          <PvButton
            type="button"
            variant="secondary"
            onClick={() => props.onOpenChange(false)}
            disabled={clearAllData.isPending}
          >
            {m.ui_btn_cancel()}
          </PvButton>
          <PvButton
            type="button"
            variant="danger"
            onClick={() => void handleDelete()}
            loading={clearAllData.isPending}
            aria-label={m.ui_delete_dialog_confirm()}
          >
            {clearAllData.isPending ? m.ui_delete_dialog_deleting() : m.ui_delete_dialog_confirm()}
          </PvButton>
        </PvDialogFooter>
      </PvDialogContent>
    </PvDialog>
  );
};
