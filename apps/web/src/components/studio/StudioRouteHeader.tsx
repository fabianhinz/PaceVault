import type { ElementType, FC, ReactNode } from 'react';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import type { TypographyVariants } from '@pacevault/ui/components/pvTypography/types.ts';
import type { StudioRoute } from '@/types.ts';
import { Route } from 'lucide-react';
import { PvIconTile } from '@pacevault/ui/components/pvIconTile/PvIconTile.tsx';
import { COLORS_BY_STUDIO_ROUTE_COLOR } from './routeColors.ts';
import { formatRouteStatsLine } from './routeStats.ts';

interface StudioRouteHeaderProps {
  route: StudioRoute;
  titleVariant?: TypographyVariants;
  titleAs?: ElementType;
  children?: ReactNode;
}

export const StudioRouteHeader: FC<StudioRouteHeaderProps> = (props) => {
  return (
    <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <PvIconTile
          icon={Route}
          style={{ color: COLORS_BY_STUDIO_ROUTE_COLOR[props.route.color].hex }}
        />
        <div className="min-w-0">
          <PvTypography variant={props.titleVariant ?? 'subtitle1'} as={props.titleAs} noWrap>
            {props.route.name}
          </PvTypography>
          <PvTypography variant="caption" as="p" color="textSecondary" className="truncate">
            {formatRouteStatsLine(props.route)}
          </PvTypography>
        </div>
      </div>
      {props.children}
    </div>
  );
};
