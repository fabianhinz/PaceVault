import { useEffect, useState } from 'react';
import { m } from '@/paraglide/messages.js';
import { useStudioStore } from '@/store/studio.ts';
import type { StudioRoute, StudioRouteColor } from '@/store/studio.ts';
import { Button } from '@/components/ui/Button.tsx';
import { Input } from '@/components/ui/Input.tsx';
import { Label } from '@/components/ui/Label.tsx';
import {
  DialogRoot,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog.tsx';
import { StudioColorPicker } from './StudioColorPicker.tsx';

/** Edit a studio route: name and track color. */
export const StudioRouteFormDialog = (props: {
  route: StudioRoute;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState<StudioRouteColor>(props.route.color);

  // Seed from the edited route each time the dialog opens.
  useEffect(() => {
    if (props.open) {
      setName(props.route.name);
      setColor(props.route.color);
    }
  }, [props.open, props.route]);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const store = useStudioStore.getState();
    store.renameStudioRoute(props.route.id, trimmed);
    store.setStudioRouteColor(props.route.id, color);
    props.onOpenChange(false);
  };

  return (
    <DialogRoot open={props.open} onOpenChange={() => props.onOpenChange(false)}>
      <DialogContent>
        <DialogTitle>{m.ui_studio_edit_title()}</DialogTitle>
        <DialogDescription>{m.ui_studio_edit_desc()}</DialogDescription>

        <div className="mt-4 flex flex-col gap-4">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={m.ui_studio_name_placeholder()}
          />
          <div>
            <Label>{m.ui_studio_color_label()}</Label>
            <StudioColorPicker value={color} onChange={setColor} />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => props.onOpenChange(false)}>
            {m.ui_btn_cancel()}
          </Button>
          <Button disabled={!name.trim()} onClick={handleSave}>
            {m.ui_btn_save()}
          </Button>
        </div>
      </DialogContent>
    </DialogRoot>
  );
};
