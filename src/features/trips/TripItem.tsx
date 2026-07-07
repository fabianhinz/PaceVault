import { useState } from 'react';
import { EllipsisVertical, Pencil, Trash2 } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { cn } from '@/lib/utils.ts';
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
import { TripHeader } from './TripHeader.tsx';
import { TripFormDialog } from './TripFormDialog.tsx';
import { DeleteTripDialog } from './DeleteTripDialog.tsx';
import { useTripSessions } from './hooks/useTripSessions.ts';

export const TripItem = (props: { trip: Trip; expanded: boolean; onToggle: () => void }) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const tripSessions = useTripSessions(props.trip);

  return (
    <>
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
                <DropdownMenuItem onSelect={() => setShowEditDialog(true)}>
                  <Pencil size={14} />
                  {m.ui_trips_edit()}
                </DropdownMenuItem>
                <DropdownMenuItem variant="danger" onSelect={() => setShowDeleteDialog(true)}>
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
      </Card>

      <TripFormDialog trip={props.trip} open={showEditDialog} onOpenChange={setShowEditDialog} />

      <DeleteTripDialog
        tripId={props.trip.id}
        tripName={props.trip.name}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      />
    </>
  );
};
