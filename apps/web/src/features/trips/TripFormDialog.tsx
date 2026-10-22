import { useEffect, useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { useTripsStore } from '@/store/trips.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { Button } from '@pacevault/ui/components/Button.tsx';
import { tileClass } from '@pacevault/ui/components/Card.tsx';
import { Input } from '@pacevault/ui/components/Input.tsx';
import { Textarea } from '@pacevault/ui/components/Textarea.tsx';
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogDescription,
} from '@pacevault/ui/components/Dialog.tsx';
import { SessionHeader } from '@/features/sessions/SessionHeader.tsx';
import type { Trip } from '@/store/trips.ts';

const UNVIRTUALIZED_LIST_CAP = 30;

export const TripFormDialog = (props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip?: Trip;
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);
  const sessions = useSessionsStore((s) => s.sessions);

  const selectableSessions = useMemo(
    () => sessions.filter((s) => !s.isPlanned).sort((a, b) => b.date - a.date),
    [sessions],
  );

  const visibleSessions = showAll
    ? selectableSessions
    : selectableSessions.slice(0, UNVIRTUALIZED_LIST_CAP);
  const hiddenCount = selectableSessions.length - visibleSessions.length;

  useEffect(() => {
    if (props.open) {
      setName(props.trip?.name ?? '');
      setDescription(props.trip?.description ?? '');
      setSelectedIds(new Set(props.trip?.sessionIds ?? []));
      setShowAll(false);
    }
  }, [props.open, props.trip]);

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
    const trimmedDescription = description.trim() || undefined;
    if (props.trip) {
      useTripsStore
        .getState()
        .updateTrip(props.trip.id, trimmed, [...selectedIds], trimmedDescription);
    } else {
      const id = useTripsStore.getState().createTrip(trimmed, trimmedDescription);
      for (const sessionId of selectedIds) {
        useTripsStore.getState().assignSession(sessionId, id);
      }
    }
    props.onOpenChange(false);
  };

  return (
    <DialogRoot open={props.open} onOpenChange={() => props.onOpenChange(false)}>
      <DialogContent className="lg:flex lg:flex-col lg:overflow-y-hidden lg:max-h-[calc(100dvh-12rem)] lg:min-h-[min(32rem,calc(100dvh-12rem))]">
        <DialogHeader title={props.trip ? m.ui_trips_edit_title() : m.ui_trips_new_title()} />
        <DialogBody>
          <DialogDescription className="shrink-0">{m.ui_trips_nudge_desc()}</DialogDescription>

          <div className="mt-4 flex shrink-0 flex-col gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={m.ui_trips_name_placeholder()}
            />
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={m.ui_trips_notes_placeholder()}
              rows={6}
              className="resize-none"
            />
          </div>

          <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            {visibleSessions.map((session) => {
              const selected = selectedIds.has(session.id);
              return (
                <button
                  key={session.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggle(session.id)}
                  className={cn(
                    tileClass,
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

            {hiddenCount > 0 && (
              <Button variant="secondary" onClick={() => setShowAll(true)}>
                {m.ui_trips_show_more({ count: String(hiddenCount) })}
              </Button>
            )}
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="secondary" onClick={() => props.onOpenChange(false)}>
            {m.ui_btn_cancel()}
          </Button>
          <Button disabled={!name.trim() || selectedIds.size === 0} onClick={handleSave}>
            {m.ui_btn_save()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
};
