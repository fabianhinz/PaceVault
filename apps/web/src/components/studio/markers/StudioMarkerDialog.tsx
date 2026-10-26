import type { FC } from 'react';
import { Trash2 } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import type { StudioRoute } from '@/types.ts';
import { useStudioMarkerEditorStore } from '@/store/studioMarkerEditor.ts';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { PvInput } from '@pacevault/ui/components/pvInput/PvInput.tsx';
import { PvTextarea } from '@pacevault/ui/components/pvTextarea/PvTextarea.tsx';
import { PvLabel } from '@pacevault/ui/components/pvLabel/PvLabel.tsx';
import { PvDialog } from '@pacevault/ui/components/pvDialog/PvDialog.tsx';
import { PvDialogContent } from '@pacevault/ui/components/pvDialog/PvDialogContent.tsx';
import { PvDialogHeader } from '@pacevault/ui/components/pvDialog/PvDialogHeader.tsx';
import { PvDialogBody } from '@pacevault/ui/components/pvDialog/PvDialogBody.tsx';
import { PvDialogFooter } from '@pacevault/ui/components/pvDialog/PvDialogFooter.tsx';
import { PvDialogDescription } from '@pacevault/ui/components/pvDialog/PvDialogDescription.tsx';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { useStudioMarkerForm } from '@/components/studio/hooks/useStudioMarkerForm.ts';

interface StudioMarkerDialogProps {
  route: StudioRoute;
}

/**
 * Shared add/edit dialog for both marker types. Opened from the Tools cards or a
 * map pin via the editor store; mounted once at the route-detail level so pin
 * clicks work on either tab.
 */
export const StudioMarkerDialog: FC<StudioMarkerDialogProps> = (props) => {
  const form = useStudioMarkerForm(props.route);

  return (
    <PvDialog open={form.active} onOpenChange={() => useStudioMarkerEditorStore.getState().close()}>
      <PvDialogContent closeLabel={m.ui_sheet_drag_close()}>
        <PvDialogHeader title={form.title} />
        <PvDialogBody>
          <PvDialogDescription>{m.ui_studio_marker_position_desc()}</PvDialogDescription>

          <div className="mt-4 flex flex-col gap-4">
            {form.poiMarker && (
              <div>
                <PvLabel>{m.ui_studio_marker_label()}</PvLabel>
                <PvInput
                  value={form.label}
                  onChange={(e) => form.setLabel(e.target.value)}
                  placeholder={m.ui_studio_marker_label_placeholder()}
                />
              </div>
            )}

            <div>
              <PvLabel>{m.ui_studio_marker_km_label()}</PvLabel>
              <PvInput
                type="number"
                min={0}
                max={form.maxKm}
                step={0.01}
                value={form.kmText}
                onChange={(e) => form.handleKmStartChange(e.target.value)}
              />
            </div>

            {form.showsFromSplit && (
              <div>
                <PvLabel>{m.ui_studio_marker_from_split_label()}</PvLabel>
                <PvInput
                  type="number"
                  min={0}
                  max={form.maxKm}
                  step={0.01}
                  value={form.kmFromSplitText}
                  onChange={(e) => form.handleKmFromSplitChange(e.target.value)}
                />
              </div>
            )}

            {form.poiMarker && (
              <div>
                <PvLabel>{m.ui_studio_marker_description()}</PvLabel>
                <PvTextarea
                  value={form.description}
                  onChange={(e) => form.setDescription(e.target.value)}
                  placeholder={m.ui_studio_marker_description_placeholder()}
                />
              </div>
            )}
          </div>
        </PvDialogBody>

        <PvDialogFooter className={cn(form.editing && 'max-lg:grid-cols-[auto_1fr_1fr]')}>
          {form.editing && (
            // max-w-fit undoes the footer's phone w-full, so mr-2 widens the gap to Cancel.
            <PvButton
              variant="danger"
              size="icon"
              aria-label={m.ui_btn_delete()}
              className="max-lg:mr-2 max-lg:max-w-fit lg:mr-auto"
              onClick={form.handleDelete}
            >
              <Trash2 size={16} />
            </PvButton>
          )}
          <PvButton
            variant="secondary"
            onClick={() => useStudioMarkerEditorStore.getState().close()}
          >
            {m.ui_btn_cancel()}
          </PvButton>
          <PvButton disabled={!form.saveEnabled} onClick={form.handleSave}>
            {m.ui_btn_save()}
          </PvButton>
        </PvDialogFooter>
      </PvDialogContent>
    </PvDialog>
  );
};
