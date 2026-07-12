import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card.tsx';
import type { StudioRoute } from '@/store/studio.ts';
import { StudioRouteHeader } from './StudioRouteHeader.tsx';
import { useMapHover } from '@/lib/hooks/useMapHover.ts';

export const StudioRouteItem = (props: { route: StudioRoute; onNavigate?: () => void }) => {
  const navigate = useNavigate();
  const routeHover = useMapHover('studioRoute', props.route.id);

  const handleNavigate = () => {
    navigate(`/studio/${props.route.id}`);
    props.onNavigate?.();
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      aria-label={props.route.name}
      onPointerEnter={routeHover.onPointerEnter}
      onPointerLeave={routeHover.onPointerLeave}
      onClick={handleNavigate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleNavigate();
        }
      }}
      className="cursor-pointer hover:bg-white/10"
    >
      <StudioRouteHeader route={props.route} />
    </Card>
  );
};
