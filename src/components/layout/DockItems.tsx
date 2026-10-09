import type { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  FlaskConical,
  Funnel,
  LayoutDashboard,
  Locate,
  LocateFixed,
  LocateOff,
  Settings,
  Zap,
} from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { cn } from '@/lib/utils.ts';
import type { HighlightTrack } from '@/lib/slidingHighlight.ts';
import { useFiltersStore } from '@/store/filters.ts';
import { useGeolocationStore } from '@/store/geolocation.ts';
import { Button } from '@/components/ui/Button.tsx';
import { glassClass } from '@/components/ui/Card.tsx';
import { IconBadge } from '@/components/ui/IconBadge.tsx';
import { SlidingHighlight } from '@/components/ui/SlidingHighlight.tsx';

type DockItemKind = 'rail' | 'circle';

const tabs = [
  { to: '/', label: m.ui_nav_dashboard, icon: LayoutDashboard },
  { to: '/sessions', label: m.ui_nav_sessions, icon: Zap },
  { to: '/labs', label: m.ui_nav_labs, icon: FlaskConical },
  { to: '/settings', label: m.ui_nav_settings, icon: Settings },
];

const isTabActive = (to: string, pathname: string): boolean => {
  if (to === '/') return pathname === '/';
  if (to === '/sessions') return pathname.startsWith('/sessions') || pathname.startsWith('/trips');
  if (to === '/labs') return pathname.startsWith('/labs') || pathname.startsWith('/studio');
  return pathname.startsWith(to);
};

const tracks: Record<'rail' | 'pill', HighlightTrack> = {
  rail: { count: tabs.length, padding: 4, gap: 4, itemSize: 40 },
  pill: { count: tabs.length, padding: 3, gap: 2, itemSize: 'share' },
};

const trackClasses: Record<'rail' | 'pill', string> = {
  rail: 'flex-col gap-1 p-1',
  pill: 'min-w-0 flex-1 gap-0.5 p-[3px]',
};

const itemClasses: Record<'rail' | 'pill' | 'circle', string> = {
  rail: 'size-10',
  pill: 'h-11 min-w-0 flex-1',
  circle: 'size-11',
};

const itemClass = 'relative shrink-0 rounded-full text-text-tertiary';

const activeItemClass =
  'bg-accent-muted text-accent-hover hover:bg-accent-muted hover:text-accent-hover';

const segmentClass = cn(glassClass, 'flex rounded-full');

export const DockSegment = (props: { className?: string; children: ReactNode }) => (
  <div className={cn(segmentClass, props.className)}>{props.children}</div>
);

interface DockTabsProps {
  kind: 'rail' | 'pill';
  onTabClick: () => void;
}

export const DockTabs = (props: DockTabsProps) => {
  const location = useLocation();
  const activeIndex = tabs.findIndex((tab) => isTabActive(tab.to, location.pathname));
  return (
    <nav className={cn(segmentClass, 'relative', trackClasses[props.kind])}>
      <SlidingHighlight
        track={tracks[props.kind]}
        axis={props.kind === 'rail' ? 'y' : 'x'}
        index={activeIndex}
      />
      {tabs.map((tab, index) => (
        <Button
          key={tab.to}
          asChild
          variant="ghost"
          size="icon"
          className={cn(
            itemClass,
            itemClasses[props.kind],
            index === activeIndex &&
              'cursor-default text-accent-hover hover:bg-transparent hover:text-accent-hover',
          )}
        >
          <NavLink
            to={tab.to}
            end={tab.to === '/'}
            onClick={props.onTabClick}
            aria-label={tab.label()}
          >
            <tab.icon size={20} strokeWidth={1.5} />
          </NavLink>
        </Button>
      ))}
    </nav>
  );
};

const DockCircle = (props: { children: ReactNode }) => (
  <div className={cn(glassClass, 'shrink-0 rounded-full p-[3px]')}>{props.children}</div>
);

interface DockFilterButtonProps {
  kind: DockItemKind;
  open: boolean;
  onClick: () => void;
}

export const DockFilterButton = (props: DockFilterButtonProps) => {
  const filterActive = useFiltersStore((s) => s.activeFilter !== null);
  const button = (
    <Button
      variant="ghost"
      size="icon"
      className={cn(itemClass, itemClasses[props.kind], props.open && activeItemClass)}
      onClick={props.onClick}
      aria-label={m.ui_dock_filter()}
      aria-expanded={props.open}
    >
      <IconBadge show={filterActive}>
        <Funnel size={20} strokeWidth={1.5} />
      </IconBadge>
    </Button>
  );
  if (props.kind === 'circle') {
    return <DockCircle>{button}</DockCircle>;
  }
  return button;
};

export const DockLocateButton = (props: { kind: DockItemKind }) => {
  const tracking = useGeolocationStore((s) => s.tracking);
  const error = useGeolocationStore((s) => s.error);
  let LocateIcon = Locate;
  if (error) {
    LocateIcon = LocateOff;
  } else if (tracking) {
    LocateIcon = LocateFixed;
  }
  const button = (
    <Button
      variant="ghost"
      size="icon"
      className={cn(itemClass, itemClasses[props.kind])}
      onClick={() => useGeolocationStore.getState().toggleTracking()}
      aria-label={m.ui_dock_locate_me()}
    >
      <IconBadge show={tracking}>
        <LocateIcon size={20} strokeWidth={1.5} />
      </IconBadge>
    </Button>
  );
  if (props.kind === 'circle') {
    return <DockCircle>{button}</DockCircle>;
  }
  return button;
};
