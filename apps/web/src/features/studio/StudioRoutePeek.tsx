import { SheetPeek } from '@pacevault/ui/components/SheetPeek.tsx';
import type { StudioRoute } from '@/store/studio.ts';
import { Route } from 'lucide-react';
import { IconTile } from '@pacevault/ui/components/IconTile.tsx';
import { formatRouteStatsLine } from './routeStats.ts';

export const StudioRoutePeek = (props: { route: StudioRoute }) => (
  <SheetPeek
    icon={<IconTile icon={Route} />}
    primary={props.route.name}
    secondary={formatRouteStatsLine(props.route)}
  />
);
