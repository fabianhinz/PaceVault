import { useState, type ComponentProps, type FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { useStudioStore } from '@/store/studio.ts';
import type { StudioRoute, StudioRouteColor } from '@/store/studio.ts';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { PvInput } from '@pacevault/ui/components/pvInput/PvInput.tsx';
import { PvLabel } from '@pacevault/ui/components/pvLabel/PvLabel.tsx';
import { PvDialog } from '@pacevault/ui/components/pvDialog/PvDialog.tsx';
import { PvDialogContent } from '@pacevault/ui/components/pvDialog/PvDialogContent.tsx';
import { PvDialogHeader } from '@pacevault/ui/components/pvDialog/PvDialogHeader.tsx';
import { PvDialogBody } from '@pacevault/ui/components/pvDialog/PvDialogBody.tsx';
import { PvDialogFooter } from '@pacevault/ui/components/pvDialog/PvDialogFooter.tsx';
import { PvDialogDescription } from '@pacevault/ui/components/pvDialog/PvDialogDescription.tsx';
import { StudioColorPicker } from './StudioColorPicker.tsx';

interface StudioRouteFormDialogProps extends Required<
  Pick<ComponentProps<typeof PvDialog>, 'open' | 'onOpenChange'>
> {
  route: StudioRoute;
}

export const StudioRouteFormDialog: FC<StudioRouteFormDialogProps> = (props) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState<StudioRouteColor>(props.route.color);

  const [seededOpen, setSeededOpen] = useState(false);
  if (props.open !== seededOpen) {
    setSeededOpen(props.open);
    if (props.open) {
      setName(props.route.name);
      setColor(props.route.color);
    }
  }

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const store = useStudioStore.getState();
    store.renameStudioRoute({ id: props.route.id, name: trimmed });
    store.setStudioRouteColor({ id: props.route.id, color });
    props.onOpenChange(false);
  };

  return (
    <PvDialog open={props.open} onOpenChange={() => props.onOpenChange(false)}>
      <PvDialogContent closeLabel={m.ui_sheet_drag_close()}>
        <PvDialogHeader title={m.ui_studio_edit_title()} />
        <PvDialogBody>
          <PvDialogDescription>{m.ui_studio_edit_desc()}</PvDialogDescription>

          <div className="mt-4 flex flex-col gap-4">
            <PvInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={m.ui_studio_name_placeholder()}
            />
            <div>
              <PvLabel>{m.ui_studio_color_label()}</PvLabel>
              <StudioColorPicker value={color} onChange={setColor} />
            </div>
          </div>
        </PvDialogBody>

        <PvDialogFooter>
          <PvButton variant="secondary" onClick={() => props.onOpenChange(false)}>
            {m.ui_btn_cancel()}
          </PvButton>
          <PvButton disabled={!name.trim()} onClick={handleSave}>
            {m.ui_btn_save()}
          </PvButton>
        </PvDialogFooter>
      </PvDialogContent>
    </PvDialog>
  );
};
