import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card.tsx';
import type { StudioRoute } from '@/store/studio.ts';
import { StudioRouteHeader } from './StudioRouteHeader.tsx';
import { useStudioRouteHover } from './hooks/useStudioRouteHover.ts';

export const StudioRouteItem = (props: { route: StudioRoute }) => {
  const navigate = useNavigate();
  const routeHover = useStudioRouteHover(props.route.id);

  return (
    <Card
      role="button"
      tabIndex={0}
      aria-label={props.route.name}
      onPointerEnter={routeHover.onPointerEnter}
      onPointerLeave={routeHover.onPointerLeave}
      onClick={() => navigate(`/studio/${props.route.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(`/studio/${props.route.id}`);
        }
      }}
      className="cursor-pointer hover:bg-white/10"
    >
      <StudioRouteHeader route={props.route} />
    </Card>
  );
};
