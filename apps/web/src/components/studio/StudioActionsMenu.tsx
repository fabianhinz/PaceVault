import { useState, type FC } from 'react';
import { usePageRouting } from '@/routing/usePageRouting.ts';
import { FileDown, Pencil, Trash2 } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import { PvActionsMenu } from '@pacevault/ui/components/pvActionsMenu/PvActionsMenu.tsx';
import type { StudioRoute } from '@/types.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { StudioRouteFormDialog } from './StudioRouteFormDialog.tsx';
import { DeleteStudioRouteDialog } from './DeleteStudioRouteDialog.tsx';
import { useStudioRouteExport } from './hooks/useStudioRouteExport.ts';

interface StudioActionsMenuProps {
  route: StudioRoute;
}

export const StudioActionsMenu: FC<StudioActionsMenuProps> = (props) => {
  const pageRouting = usePageRouting();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const routeExport = useStudioRouteExport();

  return (
    <>
      <PvActionsMenu
        closeLabel={m.ui_sheet_drag_close()}
        label={m.ui_studio_actions()}
        items={[
          {
            id: 'edit',
            icon: Pencil,
            label: m.ui_btn_edit(),
            onSelect: () => setShowEditDialog(true),
          },
          {
            id: 'export-gpx',
            icon: FileDown,
            label: m.ui_btn_export_gpx(),
            disabled: routeExport.exporting,
            onSelect: () => void routeExport.exportRoute(props.route),
          },
          {
            id: 'delete',
            icon: Trash2,
            label: m.ui_btn_delete(),
            danger: true,
            onSelect: () => setShowDeleteDialog(true),
          },
        ]}
      />

      <StudioRouteFormDialog
        route={props.route}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />

      <DeleteStudioRouteDialog
        routeId={props.route.id}
        routeName={props.route.name}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onDeleted={() => {
          useMapFocusStore.getState().requestMapRefitAfterDelete();
          pageRouting.open({ page: 'labs', params: { tab: 'studio' } });
        }}
      />
    </>
  );
};
