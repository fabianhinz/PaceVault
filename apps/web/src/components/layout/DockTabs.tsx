import type { FC } from 'react';
import { FlaskConical, LayoutDashboard, Settings, Zap } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import { cn } from '@pacevault/ui/lib/cn.ts';
import type { HighlightTrack } from '@pacevault/ui/lib/slidingHighlight.ts';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { PvSlidingHighlight } from '@pacevault/ui/components/pvSlidingHighlight/PvSlidingHighlight.tsx';
import { PageLink } from '@/routing/PageLink.tsx';
import type { SupportedPage } from '@/routing/pageRegistry.ts';
import { useCurrentPage } from '@/routing/useCurrentPage.ts';
import { itemClass, itemClasses, segmentClass } from '@/components/layout/dockItemClasses.ts';

type DockTabPage = 'dashboard' | 'sessions' | 'labs' | 'settings';

const tabs: { page: DockTabPage; label: () => string; icon: typeof LayoutDashboard }[] = [
  { page: 'dashboard', label: m.ui_nav_dashboard, icon: LayoutDashboard },
  { page: 'sessions', label: m.ui_nav_sessions, icon: Zap },
  { page: 'labs', label: m.ui_nav_labs, icon: FlaskConical },
  { page: 'settings', label: m.ui_nav_settings, icon: Settings },
];

const TAB_BY_PAGE = {
  dashboard: 'dashboard',
  sessions: 'sessions',
  sessionDetail: 'sessions',
  tripDetail: 'sessions',
  studioDetail: 'labs',
  labs: 'labs',
  settings: 'settings',
} satisfies Record<SupportedPage, DockTabPage>;

const tracks: Record<'rail' | 'pill', HighlightTrack> = {
  rail: { count: tabs.length, padding: 4, gap: 4, itemSize: 40 },
  pill: { count: tabs.length, padding: 3, gap: 2, itemSize: 'share' },
};

const trackClasses: Record<'rail' | 'pill', string> = {
  rail: 'flex-col gap-1 p-1',
  pill: 'min-w-0 flex-1 gap-0.5 p-3px',
};

interface DockTabsProps {
  kind: 'rail' | 'pill';
  onTabClick: () => void;
}

export const DockTabs: FC<DockTabsProps> = (props) => {
  const currentPage = useCurrentPage();
  const activeIndex = tabs.findIndex(
    (tab) => currentPage !== null && TAB_BY_PAGE[currentPage] === tab.page,
  );
  return (
    <nav className={cn(segmentClass, 'relative', trackClasses[props.kind])}>
      <PvSlidingHighlight
        track={tracks[props.kind]}
        axis={props.kind === 'rail' ? 'y' : 'x'}
        index={activeIndex}
      />
      {tabs.map((tab, index) => (
        <PvButton
          key={tab.page}
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
          <PageLink
            to={{ page: tab.page, params: {} }}
            onClick={props.onTabClick}
            aria-label={tab.label()}
            aria-current={index === activeIndex ? 'page' : undefined}
          >
            <tab.icon size={20} strokeWidth={1.5} />
          </PageLink>
        </PvButton>
      ))}
    </nav>
  );
};
