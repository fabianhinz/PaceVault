import { useEffect, useState } from 'react';
import { m } from '@/paraglide/messages.js';
import { useStudioStore, type StudioRoute } from '@/store/studio.ts';
import { useStudioMarkerEditorStore } from '@/store/studioMarkerEditor.ts';
import { Button } from '@/components/ui/Button.tsx';
import { Input } from '@/components/ui/Input.tsx';
import { Textarea } from '@/components/ui/Textarea.tsx';
import { Label } from '@/components/ui/Label.tsx';
import {
  DialogRoot,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog.tsx';

const clampKm = (km: number, maxKm: number): number => {
  if (Number.isNaN(km) || km < 0) return 0;
  if (km > maxKm) return maxKm;
  return km;
};

/**
 * Shared add/edit dialog for both marker types. Opened from the Tools cards or a
 * map pin via the editor store; mounted once at the route-detail level so pin
 * clicks work on either tab.
 */
export const StudioMarkerDialog = (props: { route: StudioRoute }) => {
  const editor = useStudioMarkerEditorStore();
  const active = editor.open && editor.routeId === props.route.id;
  const existing = props.route.markers.find((mk) => mk.id === editor.markerId);
  // Edit vs. add is driven by the editor store, not the live marker lookup:
  // `close()` keeps `markerId`, so deleting a marker doesn't flip the closing
  // dialog from "edit" to "add" before its exit animation finishes.
  const isEdit = editor.markerId !== null;
  const isPoi = editor.type === 'point_of_interest';
  const maxKm = props.route.distance / 1000;

  const [kmText, setKmText] = useState('');
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');

  // Seed the form each time the dialog opens.
  useEffect(() => {
    if (!active) return;
    if (existing) {
      setKmText((existing.distanceM / 1000).toFixed(2));
      setLabel(existing.type === 'point_of_interest' ? existing.label : '');
      setDescription(existing.type === 'point_of_interest' ? (existing.description ?? '') : '');
    } else {
      const seedKm = editor.initialDistanceM != null ? editor.initialDistanceM / 1000 : maxKm / 2;
      setKmText(seedKm.toFixed(2));
      setLabel('');
      setDescription('');
    }
    // Markers can't change while the dialog is open (saving closes it), so the
    // seed inputs are effectively stable — this only re-runs on open / target.
  }, [active, editor.markerId, editor.initialDistanceM, existing, maxKm]);

  const trimmedLabel = label.trim();
  const canSave = !isPoi || trimmedLabel.length > 0;

  const handleSave = () => {
    if (!canSave) return;
    const distanceM = clampKm(Number.parseFloat(kmText), maxKm) * 1000;
    const store = useStudioStore.getState();

    if (isPoi) {
      const poiFields = {
        distanceM,
        label: trimmedLabel,
        description: description.trim() || undefined,
      };
      if (editor.markerId) {
        store.updateStudioMarker(props.route.id, editor.markerId, poiFields);
      } else {
        store.addStudioMarker(props.route.id, { type: 'point_of_interest', ...poiFields });
      }
    } else if (editor.markerId) {
      store.updateStudioMarker(props.route.id, editor.markerId, { distanceM });
    } else {
      store.addStudioMarker(props.route.id, { type: 'track_modifier', distanceM });
    }

    useStudioMarkerEditorStore.getState().close();
  };

  const handleDelete = () => {
    if (editor.markerId) {
      useStudioStore.getState().deleteStudioMarker(props.route.id, editor.markerId);
    }
    useStudioMarkerEditorStore.getState().close();
  };

  let title = m.ui_studio_marker_add_split();
  if (isPoi && isEdit) title = m.ui_studio_marker_edit_waypoint();
  else if (isPoi) title = m.ui_studio_marker_add_waypoint();
  else if (isEdit) title = m.ui_studio_marker_edit_split();

  return (
    <DialogRoot open={active} onOpenChange={() => useStudioMarkerEditorStore.getState().close()}>
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{m.ui_studio_marker_position_desc()}</DialogDescription>

        <div className="mt-4 flex flex-col gap-4">
          {isPoi && (
            <div className="flex flex-col gap-2">
              <Label>{m.ui_studio_marker_label()}</Label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={m.ui_studio_marker_label_placeholder()}
                autoFocus
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label>{m.ui_studio_marker_km_label()}</Label>
            <Input
              type="number"
              min={0}
              max={maxKm}
              step={0.01}
              value={kmText}
              onChange={(e) => setKmText(e.target.value)}
              helperText={m.ui_studio_marker_km_helper({ max: maxKm.toFixed(2) })}
              autoFocus={!isPoi}
            />
          </div>

          {isPoi && (
            <div className="flex flex-col gap-2">
              <Label>{m.ui_studio_marker_description()}</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={m.ui_studio_marker_description_placeholder()}
              />
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          {isEdit ? (
            <Button variant="danger" onClick={handleDelete}>
              {m.ui_btn_delete()}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => useStudioMarkerEditorStore.getState().close()}
            >
              {m.ui_btn_cancel()}
            </Button>
            <Button disabled={!canSave} onClick={handleSave}>
              {m.ui_btn_save()}
            </Button>
          </div>
        </div>
      </DialogContent>
    </DialogRoot>
  );
};
