import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Zap,
  Settings,
  EllipsisVertical,
  Upload,
  X,
  Activity,
  Clock,
  HeartPulse,
  FunnelPlus,
} from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { useFileUpload } from '@/features/sessions/hooks/useFileUpload.ts';
import { useFileDropEffect } from '@/features/sessions/hooks/useFileDropEffect.ts';
import { cn } from '@/lib/utils.ts';
import { cardClass } from '@/components/ui/Card.tsx';
import { useSlideIndicator } from '@/components/ui/SlideIndicator.tsx';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop.ts';
import { useFiltersStore } from '@/store/filters.ts';
import { Button } from '@/components/ui/Button.tsx';
import { MobileMapFab } from './MobileMapFab.tsx';
import { DockRevealPanel } from './DockRevealPanel.tsx';
import { DockFilterOptions, type FilterOption } from './DockFilterOptions.tsx';
import { AttributeFilterDialog } from './AttributeFilterDialog.tsx';
import { IconBadge } from '@/components/ui/IconBadge.tsx';
import { isAttributeFilterActive } from '@/lib/attributeFilters.ts';
import { sportIcon } from '@/lib/sportIcons.ts';
import {
  type TimeRange,
  timeRangeOptions,
  rangeLabelMap,
  formatCustomRangeDuration,
} from '@/lib/timeRange.ts';
import { UPLOAD_EXTENSIONS } from '@/lib/archive.ts';
import type { Sport } from '@/packages/engine/types.ts';

const tabs = [
  { to: '/', label: m.ui_nav_dashboard, icon: LayoutDashboard },
  { to: '/sessions', label: m.ui_nav_sessions, icon: Zap },
  { to: '/coach', label: m.ui_nav_coach, icon: HeartPulse },
  { to: '/settings', label: m.ui_nav_settings, icon: Settings },
];

// Trips live under the sessions section, so trip pages keep the sessions tab active.
const isTabActive = (to: string, pathname: string): boolean => {
  if (to === '/') return pathname === '/';
  if (to === '/sessions') return pathname.startsWith('/sessions') || pathname.startsWith('/trips');
  return pathname.startsWith(to);
};

const sportOptions: FilterOption<Sport | 'all'>[] = [
  { value: 'all', label: m.ui_dock_sport_all() },
  { value: 'running', label: m.ui_dock_sport_run() },
  { value: 'cycling', label: m.ui_dock_sport_cycle() },
];

const dockItemMiniClass =
  'w-12 lg:w-10 h-10 rounded-lg text-text-tertiary hover:bg-white/10 hover:text-text-primary';

const dockItemMaxiClass =
  'w-14 lg:w-16 h-14 rounded-lg text-text-tertiary hover:bg-white/10 hover:text-text-primary flex-col gap-0.5';

const revealItemClass =
  'w-12 lg:w-10 h-12 rounded-lg text-text-tertiary hover:bg-white/10 hover:text-text-primary flex-col gap-0.5';

type DockRevealLayer = 'menu' | 'sport-filter' | 'time-filter';

export const Dock = () => {
  const location = useLocation();
  const activeIndex = tabs.findIndex((tab) => isTabActive(tab.to, location.pathname));
  const dockBarRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLElement | null)[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dockExpanded = useIsDesktop();
  const indicatorElement = useSlideIndicator(dockBarRef, tabRefs, activeIndex, dockExpanded);
  const upload = useFileUpload(fileInputRef);
  useFileDropEffect(upload.handleFiles, !upload.uploading);

  const [revealStack, setRevealStack] = useState<DockRevealLayer[]>([]);

  const isOpen = useCallback(
    (layer: DockRevealLayer) => revealStack.includes(layer),
    [revealStack],
  );

  const closeAll = useCallback(() => setRevealStack([]), []);

  const handleTabClick = useCallback(() => {
    closeAll();
    window.scrollTo({ top: 0 });
  }, [closeAll]);

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

  // Filter state
  const sportFilter = useFiltersStore((s) => s.sportFilter);
  const timeRange = useFiltersStore((s) => s.timeRange);
  const customRange = useFiltersStore((s) => s.customRange);
  const attributeFilters = useFiltersStore((s) => s.attributeFilters);

  const [attrDialogOpen, setAttrDialogOpen] = useState(false);
  const attrActive = isAttributeFilterActive(attributeFilters);
  const openAttrDialog = useCallback(() => {
    setRevealStack([]);
    setAttrDialogOpen(true);
  }, []);

  const SportIcon = sportFilter === 'all' ? Activity : sportIcon[sportFilter];
  const sportLabel = sportOptions.find((o) => o.value === sportFilter)?.label ?? sportFilter;

  const timeLabel =
    timeRange === 'custom' && customRange
      ? formatCustomRangeDuration(customRange)
      : rangeLabelMap[timeRange];

  const timeFilterOptions: FilterOption<TimeRange>[] =
    timeRange === 'custom' && customRange
      ? [
          ...timeRangeOptions,
          {
            value: 'custom',
            label: formatCustomRangeDuration(customRange),
            variant: 'accent' as const,
          },
        ]
      : timeRangeOptions;

  // Escape key handler — pop top layer
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
        <MobileMapFab />
        <nav
          className={cn(
            cardClass,
            'lg:flex-row lg:items-center',
            'border-0 border-t rounded-none',
            'pb-[env(safe-area-inset-bottom)] lg:pb-0',
            'lg:border lg:rounded-2xl',
          )}
        >
          {/* Filter options panels (Level C) — top on mobile, rightmost on desktop */}
          <DockRevealPanel open={isOpen('sport-filter')} className="lg:order-3">
            <DockFilterOptions
              options={sportOptions}
              value={sportFilter}
              onValueChange={(newSportFilter) => {
                useFiltersStore.getState().setSportFilter(newSportFilter);
                closeFrom('sport-filter');
              }}
            />
          </DockRevealPanel>

          <DockRevealPanel open={isOpen('time-filter')} className="lg:order-3">
            <DockFilterOptions
              options={timeFilterOptions}
              value={timeRange}
              onValueChange={(newTimeRange) => {
                useFiltersStore.getState().setTimeRange(newTimeRange);
                closeFrom('time-filter');
              }}
            />
          </DockRevealPanel>

          {/* Mini dock menu panel (Level B) — between dock bar and filters on desktop */}
          <DockRevealPanel open={isOpen('menu') && !dockExpanded} className="lg:order-2">
            <Button
              variant="ghost"
              size="icon"
              className={revealItemClass}
              disabled={upload.uploading || !upload.profile}
              onClick={() => {
                upload.triggerUpload();
                closeFrom('menu');
              }}
              aria-label={m.ui_dock_upload_fit()}
            >
              <Upload size={20} strokeWidth={1.5} />
              <span className="text-[10px] leading-none">{m.ui_btn_upload()}</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                revealItemClass,
                isOpen('sport-filter') && 'bg-white/10 text-text-primary',
              )}
              onClick={() => toggleMiniFilter('sport-filter')}
              aria-label={m.ui_dock_sport_filter()}
            >
              <SportIcon size={20} strokeWidth={1.5} />
              <span className="text-[10px] leading-none">{m.ui_dock_sport()}</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                revealItemClass,
                isOpen('time-filter') && 'bg-white/10 text-text-primary',
              )}
              onClick={() => toggleMiniFilter('time-filter')}
              aria-label={m.ui_dock_time_filter()}
            >
              <Clock size={20} strokeWidth={1.5} />
              <span className="text-[10px] leading-none">{m.ui_dock_range()}</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={revealItemClass}
              onClick={openAttrDialog}
              aria-label={m.ui_dock_attr_filter()}
            >
              <IconBadge show={attrActive}>
                <FunnelPlus size={20} strokeWidth={1.5} />
              </IconBadge>
              <span className="text-[10px] leading-none">{m.ui_dock_attr()}</span>
            </Button>
          </DockRevealPanel>

          {/* Main dock bar */}
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

            {/* Separator */}
            <div
              className={cn(
                'bg-white/10 shrink-0 transition-all duration-300',
                'w-px h-6 mx-1 lg:w-6 lg:h-px lg:my-1 lg:mx-0',
              )}
            />

            {dockExpanded ? (
              <>
                {/* Filter buttons in maxi dock */}
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    dockItemMaxiClass,
                    isOpen('sport-filter') && 'bg-white/10 text-text-primary',
                  )}
                  onClick={() => toggleMaxiFilter('sport-filter')}
                  aria-label={m.ui_dock_sport_filter()}
                >
                  <SportIcon size={20} strokeWidth={1.5} />
                  <span className="text-[10px] leading-none truncate max-w-14">{sportLabel}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    dockItemMaxiClass,
                    isOpen('time-filter') && 'bg-white/10 text-text-primary',
                  )}
                  onClick={() => toggleMaxiFilter('time-filter')}
                  aria-label={m.ui_dock_time_filter()}
                >
                  <Clock size={20} strokeWidth={1.5} />
                  <span className="text-[10px] leading-none truncate max-w-14">{timeLabel}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className={dockItemMaxiClass}
                  onClick={openAttrDialog}
                  aria-label={m.ui_dock_attr_filter()}
                >
                  <IconBadge show={attrActive}>
                    <FunnelPlus size={20} strokeWidth={1.5} />
                  </IconBadge>
                  <span className="text-[10px] leading-none">{m.ui_dock_attr()}</span>
                </Button>

                {/* Separator */}
                <div
                  className={cn(
                    'bg-white/10 shrink-0 transition-all duration-300',
                    'w-px h-6 mx-1 lg:w-6 lg:h-px lg:my-1 lg:mx-0',
                  )}
                />

                <Button
                  variant="ghost"
                  size="icon"
                  className={dockItemMaxiClass}
                  disabled={upload.uploading || !upload.profile}
                  onClick={upload.triggerUpload}
                  aria-label={m.ui_dock_upload_fit()}
                >
                  <Upload size={20} strokeWidth={1.5} />
                  <span className="text-[10px] leading-none">{m.ui_btn_upload()}</span>
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
                  <EllipsisVertical size={20} strokeWidth={1.5} />
                )}
              </Button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={UPLOAD_EXTENSIONS.join(',')}
            multiple
            className="hidden"
            onChange={(e) => e.target.files && upload.handleFiles(e.target.files)}
            disabled={upload.uploading}
          />
        </nav>
      </div>

      <AttributeFilterDialog open={attrDialogOpen} onOpenChange={setAttrDialogOpen} />
    </>
  );
};
