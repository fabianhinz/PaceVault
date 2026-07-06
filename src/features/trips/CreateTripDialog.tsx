import { useState } from 'react';
import { Check } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { cn } from '@/lib/utils.ts';
import { useTripsStore } from '@/store/trips.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { Button } from '@/components/ui/Button.tsx';
import { Input } from '@/components/ui/Input.tsx';
import {
  DialogRoot,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog.tsx';
import { SessionHeader } from '@/features/sessions/SessionHeader.tsx';

export const CreateTripDialog = (props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const [name, setName] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const sessions = useSessionsStore((s) => s.sessions);

  const selectableSessions = sessions.filter((s) => !s.isPlanned).sort((a, b) => b.date - a.date);

  const reset = () => {
    setName('');
    setSelectedIds(new Set());
  };

  const close = () => {
    reset();
    props.onOpenChange(false);
  };

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
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
    const trimmed = name.trim();
    if (!trimmed || selectedIds.size === 0) return;
    const id = useTripsStore.getState().createTrip(trimmed);
    for (const sessionId of selectedIds) {
      useTripsStore.getState().assignSession(sessionId, id);
    }
    close();
  };

  return (
    <DialogRoot
      open={props.open}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent className="flex flex-col overflow-y-hidden">
        <DialogTitle className="shrink-0">{m.ui_trips_new_title()}</DialogTitle>
        <DialogDescription className="shrink-0">{m.ui_trips_nudge_desc()}</DialogDescription>

        <div className="mt-4 shrink-0">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={m.ui_trips_name_placeholder()}
            autoFocus
          />
        </div>

        <div className="mt-4 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto border-t border-white/10 pt-4">
          {selectableSessions.map((session) => {
            const selected = selectedIds.has(session.id);
            return (
              <button
                key={session.id}
                type="button"
                aria-pressed={selected}
                onClick={() => toggle(session.id)}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-left transition-colors hover:bg-white/10',
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
        </div>

        <div className="mt-4 flex shrink-0 justify-end gap-2">
          <Button variant="secondary" onClick={close}>
            {m.ui_btn_cancel()}
          </Button>
          <Button disabled={!name.trim() || selectedIds.size === 0} onClick={handleSave}>
            {m.ui_btn_save()}
          </Button>
        </div>
      </DialogContent>
    </DialogRoot>
  );
};
