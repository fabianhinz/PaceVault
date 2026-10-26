import type { FC } from 'react';
import { usePageRouting } from '@/routing/usePageRouting.ts';
import { PvCard } from '@pacevault/ui/components/pvCard/PvCard.tsx';
import type { StudioRoute } from '@/store/studio.ts';
import { StudioRouteHeader } from './StudioRouteHeader.tsx';
import { useMapHover } from '@/features/map/hooks/useMapHover.ts';

interface StudioRouteItemProps {
  route: StudioRoute;
  onNavigate?: () => void;
}

export const StudioRouteItem: FC<StudioRouteItemProps> = (props) => {
  const pageRouting = usePageRouting();
  const routeHover = useMapHover({ kind: 'studioRoute', id: props.route.id });

  const handleNavigate = () => {
    pageRouting.open({ page: 'studioDetail', params: { routeId: props.route.id } });
    props.onNavigate?.();
  };

  return (
    <PvCard
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
    </PvCard>
  );
};
