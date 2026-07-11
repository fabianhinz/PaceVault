import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EllipsisVertical, Pencil, Trash2 } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { Button } from '@/components/ui/Button.tsx';
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/DropdownMenu.tsx';
import type { StudioRoute } from '@/store/studio.ts';
import { StudioRouteFormDialog } from './StudioRouteFormDialog.tsx';
import { DeleteStudioRouteDialog } from './DeleteStudioRouteDialog.tsx';

export const StudioActionsMenu = (props: { route: StudioRoute }) => {
  const navigate = useNavigate();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <DropdownMenuRoot>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={m.ui_studio_actions()}>
            <EllipsisVertical size={18} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setShowEditDialog(true)}>
            <Pencil size={14} />
            {m.ui_studio_edit()}
          </DropdownMenuItem>
          <DropdownMenuItem variant="danger" onSelect={() => setShowDeleteDialog(true)}>
            <Trash2 size={14} />
            {m.ui_btn_delete()}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuRoot>

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
