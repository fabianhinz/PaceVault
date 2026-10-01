import type { ElementType, ReactNode } from 'react';
import { Typography } from '@/components/ui/Typography.tsx';
import type { TypographyVariants } from '@/components/ui/Typography.tsx';
import type { StudioRoute } from '@/store/studio.ts';
import { Route } from 'lucide-react';
import { IconTile } from '@/components/ui/IconTile.tsx';
import { routeColors } from './routeColors.ts';
import { formatRouteStatsLine } from './routeStats.ts';

export const StudioRouteHeader = (props: {
  route: StudioRoute;
  titleVariant?: TypographyVariants;
  titleAs?: ElementType;
  children?: ReactNode;
}) => {
  return (
    <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <IconTile icon={Route} style={{ color: routeColors[props.route.color].hex }} />
        <div className="min-w-0">
          <Typography variant={props.titleVariant ?? 'subtitle1'} as={props.titleAs} noWrap>
            {props.route.name}
          </Typography>
          <Typography variant="caption" as="p" color="textSecondary" className="truncate">
            {formatRouteStatsLine(props.route)}
          </Typography>
        </div>
      </div>
      {props.children}
    </div>
  );
};
