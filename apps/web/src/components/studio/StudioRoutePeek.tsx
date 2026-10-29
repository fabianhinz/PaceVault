import type { FC } from 'react';
import { PvSheetPeek } from '@pacevault/ui/components/pvBottomSheet/PvSheetPeek.tsx';
import type { StudioRoute } from '@/types.ts';
import { Route } from 'lucide-react';
import { PvIconTile } from '@pacevault/ui/components/pvIconTile/PvIconTile.tsx';
import { formatRouteStatsLine } from './routeStats.ts';

interface StudioRoutePeekProps {
  route: StudioRoute;
}

export const StudioRoutePeek: FC<StudioRoutePeekProps> = (props) => (
  <PvSheetPeek
    icon={<PvIconTile icon={Route} />}
    primary={props.route.name}
    secondary={formatRouteStatsLine(props.route)}
  />
);
