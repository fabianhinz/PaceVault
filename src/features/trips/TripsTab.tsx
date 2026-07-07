import { useEffect, useState } from 'react';
import { Compass } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { useTripsStore } from '@/store/trips.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { Button } from '@/components/ui/Button.tsx';
import { Card } from '@/components/ui/Card.tsx';
import { Typography } from '@/components/ui/Typography.tsx';
import { TripItem } from './TripItem.tsx';
import { TripFormDialog } from './TripFormDialog.tsx';

export const TripsTab = () => {
  const trips = useTripsStore((s) => s.trips);
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    const trip = trips.find((t) => t.id === expandedTripId);
    useMapFocusStore.getState().setFocusedTripSessions(trip?.sessionIds ?? []);
    return () => {
      useMapFocusStore.getState().setFocusedTripSessions([]);
    };
  }, [expandedTripId, trips]);

  const toggle = (id: string) => setExpandedTripId((cur) => (cur === id ? null : id));

  return (
    <div className="flex flex-col gap-3">
      {trips.map((trip) => (
        <TripItem
          key={trip.id}
          trip={trip}
          expanded={expandedTripId === trip.id}
          onToggle={() => toggle(trip.id)}
        />
      ))}

      {trips.length === 0 && (
        <Card className="flex-row items-center gap-3">
          <Compass size={18} className="shrink-0 text-primary" />
          <div className="min-w-0">
            <Typography>{m.ui_trips_nudge_title()}</Typography>
            <Typography variant="caption" as="p">
              {m.ui_trips_nudge_desc()}
            </Typography>
          </div>
        </Card>
      )}

      <Button variant="primary" onClick={() => setShowCreateDialog(true)}>
        {m.ui_trips_cta_title()}
      </Button>

      <TripFormDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
    </div>
  );
};
