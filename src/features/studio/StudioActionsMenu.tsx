import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileDown, Pencil, Trash2 } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { ActionsMenu } from '@/components/ui/ActionsMenu.tsx';
import type { StudioRoute } from '@/store/studio.ts';
import { StudioRouteFormDialog } from './StudioRouteFormDialog.tsx';
import { DeleteStudioRouteDialog } from './DeleteStudioRouteDialog.tsx';
import { useStudioRouteExport } from './hooks/useStudioRouteExport.ts';

export const StudioActionsMenu = (props: { route: StudioRoute }) => {
  const navigate = useNavigate();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const routeExport = useStudioRouteExport();

  return (
    <>
      <ActionsMenu
        label={m.ui_studio_actions()}
        items={[
          { icon: Pencil, label: m.ui_studio_edit(), onSelect: () => setShowEditDialog(true) },
          {
            icon: FileDown,
            label: m.ui_btn_export_gpx(),
            disabled: routeExport.exporting,
            onSelect: () => routeExport.exportRoute(props.route),
          },
          {
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
        onDeleted={() => navigate('/labs?tab=studio')}
      />
    </>
  );
};
