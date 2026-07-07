import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card.tsx';
import type { Trip } from '@/store/trips.ts';
import { TripHeader } from './TripHeader.tsx';

export const TripItem = (props: { trip: Trip }) => {
  const navigate = useNavigate();

  return (
    <Card
      role="button"
      tabIndex={0}
      aria-label={props.trip.name}
      onClick={() => navigate(`/trips/${props.trip.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(`/trips/${props.trip.id}`);
        }
      }}
      className="cursor-pointer hover:bg-white/10"
    >
      <TripHeader trip={props.trip} />
    </Card>
  );
};
