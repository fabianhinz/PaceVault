import type { ElementType, ReactNode } from 'react';
import { Route } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { Typography } from '@/components/ui/Typography.tsx';
import type { TypographyVariants } from '@/components/ui/Typography.tsx';
import { formatDate, formatDistance } from '@/lib/formatters.ts';
import type { StudioRoute } from '@/store/studio.ts';
import { routeColors } from './routeColors.ts';

/**
 * Shared studio route header: colored badge + name (primary) + one secondary
 * line of stats and import metadata. Both slots truncate instead of wrapping,
 * like the session header. Used by the route list and the detail page. Pass
 * `children` to render an actions slot beside the title.
 */
export const StudioRouteHeader = (props: {
  route: StudioRoute;
  titleVariant?: TypographyVariants;
  titleAs?: ElementType;
  children?: ReactNode;
}) => {
  const stats: string[] = [formatDistance(props.route.distance)];
  if (props.route.elevation) {
    stats.push(`+${Math.round(props.route.elevation.gain)} m`);
  }
  stats.push(
    m.ui_studio_meta({
      date: formatDate(props.route.importedAt),
      file: props.route.sourceFileName,
    }),
  );

  return (
    <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5"
          style={{ color: routeColors[props.route.color].hex }}
        >
          <Route size={18} strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <Typography variant={props.titleVariant ?? 'subtitle1'} as={props.titleAs} noWrap>
            {props.route.name}
          </Typography>
          <Typography variant="caption" as="p" color="textSecondary" className="truncate">
            {stats.join(' · ')}
          </Typography>
        </div>
      </div>
      {props.children}
    </div>
  );
};
