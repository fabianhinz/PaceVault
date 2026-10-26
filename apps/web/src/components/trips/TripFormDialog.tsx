import type { ComponentProps, FC } from 'react';
import { Check } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { useTripsStore } from '@/store/trips.ts';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { TILE_CLASS } from '@pacevault/ui/lib/surfaces.ts';
import { PvInput } from '@pacevault/ui/components/pvInput/PvInput.tsx';
import { PvTextarea } from '@pacevault/ui/components/pvTextarea/PvTextarea.tsx';
import { PvDialog } from '@pacevault/ui/components/pvDialog/PvDialog.tsx';
import { PvDialogContent } from '@pacevault/ui/components/pvDialog/PvDialogContent.tsx';
import { PvDialogHeader } from '@pacevault/ui/components/pvDialog/PvDialogHeader.tsx';
import { PvDialogBody } from '@pacevault/ui/components/pvDialog/PvDialogBody.tsx';
import { PvDialogFooter } from '@pacevault/ui/components/pvDialog/PvDialogFooter.tsx';
import { PvDialogDescription } from '@pacevault/ui/components/pvDialog/PvDialogDescription.tsx';
import { SessionHeader } from '@/components/sessions/SessionHeader.tsx';
import type { Trip } from '@/store/trips.ts';
import { useTripDraft } from '@/components/trips/hooks/useTripDraft.ts';
import { useTripSessionPicker } from '@/components/trips/hooks/useTripSessionPicker.ts';

interface TripFormDialogProps extends Required<
  Pick<ComponentProps<typeof PvDialog>, 'open' | 'onOpenChange'>
> {
  trip?: Trip;
}

export const TripFormDialog: FC<TripFormDialogProps> = (props) => {
  const draft = useTripDraft({ open: props.open, trip: props.trip });
  const picker = useTripSessionPicker(draft.showAll);

  const toggle = (id: string) => {
    draft.setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSave = () => {
    const trimmed = draft.name.trim();
    if (!trimmed || draft.selectedIds.size === 0) return;
    const trimmedDescription = draft.description.trim() || undefined;
    if (props.trip) {
      useTripsStore.getState().updateTrip({
        id: props.trip.id,
        name: trimmed,
        sessionIds: [...draft.selectedIds],
        description: trimmedDescription,
      });
    } else {
      const id = useTripsStore
        .getState()
        .createTrip({ name: trimmed, description: trimmedDescription });
      for (const sessionId of draft.selectedIds) {
        useTripsStore.getState().assignSession({ sessionId, tripId: id });
      }
    }
    props.onOpenChange(false);
  };

  return (
    <PvDialog open={props.open} onOpenChange={() => props.onOpenChange(false)}>
      <PvDialogContent
        closeLabel={m.ui_sheet_drag_close()}
        className="lg:flex lg:flex-col lg:overflow-y-hidden lg:max-h-[calc(100dvh-12rem)] lg:min-h-[min(32rem,calc(100dvh-12rem))]"
      >
        <PvDialogHeader title={props.trip ? m.ui_trips_edit_title() : m.ui_trips_new_title()} />
        <PvDialogBody>
          <PvDialogDescription className="shrink-0">{m.ui_trips_nudge_desc()}</PvDialogDescription>

          <div className="mt-4 flex shrink-0 flex-col gap-2">
            <PvInput
              value={draft.name}
              onChange={(e) => draft.setName(e.target.value)}
              placeholder={m.ui_trips_name_placeholder()}
            />
            <PvTextarea
              value={draft.description}
              onChange={(e) => draft.setDescription(e.target.value)}
              placeholder={m.ui_trips_notes_placeholder()}
              rows={6}
              className="resize-none"
            />
          </div>

          <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            {picker.visibleSessions.map((session) => {
              const selected = draft.selectedIds.has(session.id);
              return (
                <button
                  key={session.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggle(session.id)}
                  className={cn(
                    TILE_CLASS,
                    'flex cursor-pointer items-center gap-3 p-3 text-left transition-colors hover:bg-white/10',
                    selected && 'bg-white/10',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors',
                      selected ? 'border-transparent bg-accent text-white' : 'border-white/30',
                    )}
                  >
                    {selected && <Check size={14} />}
                  </span>
                  <SessionHeader
                    session={session}
                    titleVariant="subtitle1"
                    className="min-w-0 flex-1"
                  />
                </button>
              );
            })}

            {picker.hiddenCount > 0 && (
              <PvButton variant="secondary" onClick={() => draft.setShowAll(true)}>
                {m.ui_trips_show_more({ count: String(picker.hiddenCount) })}
              </PvButton>
            )}
          </div>
        </PvDialogBody>

        <PvDialogFooter>
          <PvButton variant="secondary" onClick={() => props.onOpenChange(false)}>
            {m.ui_btn_cancel()}
          </PvButton>
          <PvButton
            disabled={!draft.name.trim() || draft.selectedIds.size === 0}
            onClick={handleSave}
          >
            {m.ui_btn_save()}
          </PvButton>
        </PvDialogFooter>
      </PvDialogContent>
    </PvDialog>
  );
};
