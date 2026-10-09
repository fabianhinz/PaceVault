import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Zap,
  Settings,
  EllipsisVertical,
  X,
  FlaskConical,
  Funnel,
  Locate,
  LocateFixed,
  LocateOff,
} from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { useFileUpload } from '@/features/sessions/hooks/useFileUpload.ts';
import { useFileDropEffect } from '@/features/sessions/hooks/useFileDropEffect.ts';
import { cn } from '@/lib/utils.ts';
import { cardClass } from '@/components/ui/Card.tsx';
import { useSlideIndicator } from '@/components/ui/SlideIndicator.tsx';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop.ts';
import { useFiltersStore } from '@/store/filters.ts';
import { useGeolocationStore } from '@/store/geolocation.ts';
import { Button } from '@/components/ui/Button.tsx';
import { useSheetScrollElement } from '@/lib/hooks/useSheetScrollElement.ts';
import { DockRevealPanel } from './DockRevealPanel.tsx';
import { IconBadge } from '@/components/ui/IconBadge.tsx';
import { FilterList } from '@/features/filters/FilterList.tsx';
import { FilterBuilderDialog } from '@/features/filters/FilterBuilderDialog.tsx';
import { useFilterBuilderShortcutEffect } from '@/features/filters/hooks/useFilterBuilderShortcutEffect.ts';

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

const dockItemMiniClass =
  'w-12 lg:w-10 h-10 rounded-lg text-text-tertiary hover:bg-white/10 hover:text-text-primary';

const dockItemMaxiClass =
  'w-14 lg:w-16 h-14 rounded-lg text-text-tertiary hover:bg-white/10 hover:text-text-primary flex-col gap-0.5';

const revealItemClass =
  'w-12 lg:w-10 h-12 rounded-lg text-text-tertiary hover:bg-white/10 hover:text-text-primary flex-col gap-0.5';

type DockRevealLayer = 'menu' | 'filter-list';

export const Dock = () => {
  const location = useLocation();
  const activeIndex = tabs.findIndex((tab) => isTabActive(tab.to, location.pathname));
  const dockBarRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLElement | null)[]>([]);
  const dockExpanded = useIsDesktop();
  const indicatorElement = useSlideIndicator(dockBarRef, tabRefs, activeIndex, dockExpanded);
  const sheetScroller = useSheetScrollElement();
  const upload = useFileUpload();
  useFileDropEffect(upload.handleFiles, !upload.uploading);

  const [revealStack, setRevealStack] = useState<DockRevealLayer[]>([]);

  const isOpen = useCallback(
    (layer: DockRevealLayer) => revealStack.includes(layer),
    [revealStack],
  );

  const closeAll = useCallback(() => setRevealStack([]), []);

  const handleTabClick = useCallback(() => {
    closeAll();
    if (sheetScroller) {
      sheetScroller.scrollTo({ top: 0 });
    } else {
      window.scrollTo({ top: 0 });
    }
  }, [closeAll, sheetScroller]);

  const closeFrom = useCallback(
    (layer: DockRevealLayer) =>
      setRevealStack((prev) => {
        const idx = prev.indexOf(layer);
        return idx === -1 ? prev : prev.slice(0, idx);
      }),
    [],
  );

  const toggleMaxiFilter = useCallback((layer: DockRevealLayer) => {
    setRevealStack((prev) => (prev.length === 1 && prev[0] === layer ? [] : [layer]));
  }, []);

  const toggleMiniFilter = useCallback((layer: DockRevealLayer) => {
    setRevealStack((prev) =>
      prev.includes(layer) ? prev.filter((l) => l !== layer) : ['menu' as const, layer],
    );
  }, []);

  const filterActive = useFiltersStore((s) => s.activeFilter !== null);

  const [builder, setBuilder] = useState<{ open: boolean; editingId: string | null }>({
    open: false,
    editingId: null,
  });
  const openBuilder = useCallback((editingId: string | null) => {
    setRevealStack([]);
    setBuilder({ open: true, editingId });
  }, []);
  const toggleBuilder = useCallback(() => {
    setRevealStack([]);
    setBuilder((prev) => ({ open: !prev.open, editingId: null }));
  }, []);
  useFilterBuilderShortcutEffect(toggleBuilder);

  const geoTracking = useGeolocationStore((s) => s.tracking);
  const geoError = useGeolocationStore((s) => s.error);
  let LocateIcon = Locate;
  if (geoError) {
    LocateIcon = LocateOff;
  } else if (geoTracking) {
    LocateIcon = LocateFixed;
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && revealStack.length > 0) {
        setRevealStack((prev) => prev.slice(0, -1));
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [revealStack.length]);

  return (
    <>
      <div
        data-layout="dock"
        className={cn(
          'fixed z-50',
          'bottom-0 inset-x-0',
          'lg:inset-x-auto lg:bottom-auto lg:left-3 lg:top-1/2 lg:-translate-y-1/2',
          'transition-all duration-300',
        )}
      >
        <nav
          className={cn(
            cardClass,
            'lg:flex-row lg:items-center',
            'border-0 border-t rounded-none',
            'pb-[env(safe-area-inset-bottom)] lg:pb-0',
            'lg:border lg:rounded-2xl',
          )}
        >
          <DockRevealPanel open={isOpen('filter-list')} className="lg:order-3">
            <FilterList
              onApplied={closeAll}
              onCreate={() => openBuilder(null)}
              onEdit={(id) => openBuilder(id)}
            />
          </DockRevealPanel>

          <DockRevealPanel open={isOpen('menu') && !dockExpanded} className="lg:order-2">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                revealItemClass,
                isOpen('filter-list') && 'bg-white/10 text-text-primary',
              )}
              onClick={() => toggleMiniFilter('filter-list')}
              aria-label={m.ui_dock_filter()}
              aria-expanded={isOpen('filter-list')}
            >
              <IconBadge show={filterActive}>
                <Funnel size={20} strokeWidth={1.5} />
              </IconBadge>
              <span className="text-[10px] leading-none">{m.ui_dock_filter()}</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={revealItemClass}
              onClick={() => {
                useGeolocationStore.getState().toggleTracking();
                closeFrom('menu');
              }}
              aria-label={m.ui_dock_locate_me()}
            >
              <IconBadge show={geoTracking}>
                <LocateIcon size={20} strokeWidth={1.5} />
              </IconBadge>
              <span className="text-[10px] leading-none">{m.ui_dock_locate()}</span>
            </Button>
          </DockRevealPanel>

          <div
            ref={dockBarRef}
            className="relative flex flex-row lg:flex-col items-center justify-center p-2 lg:order-1"
          >
            {indicatorElement}

            {tabs.map((tab, i) => (
              <NavLink
                key={tab.to}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                to={tab.to}
                end={tab.to === '/'}
                onClick={handleTabClick}
                aria-label={tab.label()}
                className={cn(
                  'relative flex items-center justify-center rounded-lg transition-all duration-300 overflow-hidden',
                  dockExpanded ? dockItemMaxiClass : 'w-12 lg:w-10 h-10',
                  isTabActive(tab.to, location.pathname)
                    ? 'text-text-primary'
                    : 'text-text-tertiary hover:bg-white/10 hover:text-text-primary',
                )}
              >
                <tab.icon size={20} strokeWidth={1.5} />
                {dockExpanded && <span className="text-[10px] leading-none">{tab.label()}</span>}
              </NavLink>
            ))}

            <div
              className={cn(
                'bg-white/10 shrink-0 transition-all duration-300',
                'w-px h-6 mx-1 lg:w-6 lg:h-px lg:my-1 lg:mx-0',
              )}
            />

            {dockExpanded ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    dockItemMaxiClass,
                    isOpen('filter-list') && 'bg-white/10 text-text-primary',
                  )}
                  onClick={() => toggleMaxiFilter('filter-list')}
                  aria-label={m.ui_dock_filter()}
                  aria-expanded={isOpen('filter-list')}
                >
                  <IconBadge show={filterActive}>
                    <Funnel size={20} strokeWidth={1.5} />
                  </IconBadge>
                  <span className="text-[10px] leading-none">{m.ui_dock_filter()}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className={dockItemMaxiClass}
                  onClick={() => useGeolocationStore.getState().toggleTracking()}
                  aria-label={m.ui_dock_locate_me()}
                >
                  <IconBadge show={geoTracking}>
                    <LocateIcon size={20} strokeWidth={1.5} />
                  </IconBadge>
                  <span className="text-[10px] leading-none">{m.ui_dock_locate()}</span>
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className={dockItemMiniClass}
                onClick={() => setRevealStack((prev) => (prev.includes('menu') ? [] : ['menu']))}
                aria-label={isOpen('menu') ? m.ui_dock_close_menu() : m.ui_dock_more_actions()}
              >
                {isOpen('menu') ? (
                  <X size={20} strokeWidth={1.5} />
                ) : (
                  <IconBadge show={filterActive}>
                    <EllipsisVertical size={20} strokeWidth={1.5} />
                  </IconBadge>
                )}
              </Button>
            )}
          </div>
        </nav>
      </div>

      <FilterBuilderDialog
        open={builder.open}
        editingId={builder.editingId}
        onOpenChange={(open) => setBuilder((prev) => ({ open, editingId: prev.editingId }))}
      />
    </>
  );
};
