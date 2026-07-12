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
import { toKm } from '@/lib/formatters.ts';

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
  const [kmFromSplitText, setKmFromSplitText] = useState('');
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  // The split just before this marker (fixed while the dialog is open). `null`
  // when there is none — then the "distance from last split" input is disabled.
  const [prevSplitM, setPrevSplitM] = useState<number | null>(null);

  // Seed the form each time the dialog opens.
  useEffect(() => {
    if (!active) return;

    let seedM: number;
    if (existing) {
      seedM = existing.distanceM;
      if (existing.type === 'point_of_interest') {
        setLabel(existing.label);
        setDescription(existing.description ?? '');
      } else {
        setLabel('');
        setDescription('');
      }
    } else {
      seedM = editor.initialDistanceM ?? props.route.distance / 2;
      setLabel('');
      setDescription('');
    }
    setKmText(toKm(seedM));

    if (isPoi) {
      setPrevSplitM(null);
      setKmFromSplitText('');
    } else {
      const prev = props.route.markers
        .filter(
          (mk) => mk.type === 'track_modifier' && mk.id !== editor.markerId && mk.distanceM < seedM,
        )
        .reduce<number | null>((max, mk) => Math.max(max ?? 0, mk.distanceM), null);
      setPrevSplitM(prev);
      setKmFromSplitText(prev !== null ? toKm(seedM - prev) : '');
    }
    // Markers can't change while the dialog is open (saving closes it), so the
    // seed inputs are effectively stable — this only re-runs on open / target.
  }, [active, editor.markerId, editor.initialDistanceM, existing, isPoi, props.route]);

  const trimmedLabel = label.trim();
  const canSave = !isPoi || trimmedLabel.length > 0;

  // "Distance from start" and "distance from last split" are two views of the
  // same position — editing one keeps the other in sync.
  const handleKmStartChange = (value: string) => {
    setKmText(value);
    if (prevSplitM !== null) {
      const distanceM = clampKm(Number.parseFloat(value), maxKm) * 1000;
      setKmFromSplitText(toKm(Math.max(0, distanceM - prevSplitM)));
    }
  };

  const handleKmFromSplitChange = (value: string) => {
    setKmFromSplitText(value);
    if (prevSplitM !== null) {
      const offsetKm = Number.parseFloat(value);
      const offset = Number.isNaN(offsetKm) ? 0 : Math.max(0, offsetKm);
      const distanceM = clampKm(prevSplitM / 1000 + offset, maxKm) * 1000;
      setKmText(toKm(distanceM));
    }
  };

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
              onChange={(e) => handleKmStartChange(e.target.value)}
              autoFocus={!isPoi}
            />
          </div>

          {!isPoi && (
            <div className="flex flex-col gap-2">
              <Label>{m.ui_studio_marker_from_split_label()}</Label>
              <Input
                type="number"
                min={0}
                max={maxKm}
                step={0.01}
                value={kmFromSplitText}
                disabled={prevSplitM === null}
                onChange={(e) => handleKmFromSplitChange(e.target.value)}
                helperText={prevSplitM === null ? m.ui_studio_marker_from_split_empty() : undefined}
              />
            </div>
          )}

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
