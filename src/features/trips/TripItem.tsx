import { useState } from 'react';
import { EllipsisVertical, Trash2 } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { cn } from '@/lib/utils.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { Card } from '@/components/ui/Card.tsx';
import { Button } from '@/components/ui/Button.tsx';
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/DropdownMenu.tsx';
import { SessionItem } from '@/features/sessions/SessionItem.tsx';
import type { Trip } from '@/store/trips.ts';
import type { TrainingSession } from '@/packages/engine/types.ts';
import { TripHeader } from './TripHeader.tsx';
import { DeleteTripDialog } from './DeleteTripDialog.tsx';

export const TripItem = (props: { trip: Trip; expanded: boolean; onToggle: () => void }) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const sessions = useSessionsStore((s) => s.sessions);

  const tripSessions = props.trip.sessionIds
    .map((id) => sessions.find((s) => s.id === id))
    .filter((s): s is TrainingSession => Boolean(s))
    .sort((a, b) => b.date - a.date);

  return (
    <Card
      role="button"
      tabIndex={0}
      aria-expanded={props.expanded}
      aria-label={props.trip.name}
      onClick={props.onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          props.onToggle();
        }
      }}
      className="p-0 overflow-hidden hover:bg-white/10 cursor-pointer"
    >
      <div className="flex items-center gap-3 p-4">
        <TripHeader trip={props.trip} />
        <div
          className="shrink-0"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <DropdownMenuRoot>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={m.ui_trips_actions()}>
                <EllipsisVertical size={18} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-status-danger focus:text-status-danger"
                onSelect={() => setShowDeleteDialog(true)}
              >
                <Trash2 size={14} />
                {m.ui_btn_delete()}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuRoot>
        </div>
      </div>

      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-out',
          props.expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          {tripSessions.length > 0 && (
            <div
              className="flex flex-col gap-2 border-t border-white/10 px-4 pb-4 pt-3"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              {tripSessions.map((s) => (
                <SessionItem key={s.id} session={s} />
              ))}
            </div>
          )}
        </div>
      </div>

      <DeleteTripDialog
        tripId={props.trip.id}
        tripName={props.trip.name}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      />
    </Card>
  );
};
