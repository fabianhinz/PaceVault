import { cn } from '@/lib/utils.ts';
import { useLayoutStore } from '@/store/layout.ts';
import { MapBackground } from '@/features/map/MapBackground.tsx';
import { Dock } from './Dock.tsx';
import { DemoBanner } from './DemoBanner.tsx';
import { OnboardingPage } from '@/pages/OnboardingPage.tsx';
import { Outlet, useLocation } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { RouteErrorFallback } from '@/components/ui/ErrorFallbacks.tsx';
import { DebugCrashTrigger } from '@/lib/debug/DebugCrashTrigger.tsx';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop.ts';
import { useIntervalsSync } from '@/features/intervals/hooks/useIntervalsSync.ts';
import { ImportProgressOverlay } from '@/components/ui/ImportProgressOverlay.tsx';

export const AppLayout = () => {
  const mobileMapActive = useLayoutStore((s) => s.mobileMapActive);
  const onboardingComplete = useLayoutStore((s) => s.onboardingComplete);
  const isDesktop = useIsDesktop();
  const location = useLocation();

  useIntervalsSync();

  return (
    <div className="min-h-screen overflow-hidden">
      <ErrorBoundary fallback={null}>
        <DebugCrashTrigger target="map" />
        <MapBackground
          className={cn(
            'transition-all duration-300 ease-in-out',
            onboardingComplete &&
              !isDesktop &&
              !mobileMapActive &&
              'opacity-0 scale-95 pointer-events-none',
          )}
        />
      </ErrorBoundary>
      {onboardingComplete ? (
        <>
          <main
            data-layout="main"
            data-map-active={mobileMapActive || undefined}
            className={cn(
              'relative z-10 p-6 w-full transition-all duration-300 ease-in-out',
              'pt-[max(1.5rem,env(safe-area-inset-top))]',
              'pl-[max(1.5rem,env(safe-area-inset-left))] pr-[max(1.5rem,env(safe-area-inset-right))]',
              'mx-auto max-w-[1280px] lg:pl-0 lg:ml-auto lg:mr-0 lg:max-w-[40dvw]',
              isDesktop ? 'pb-28' : 'pb-[calc(5rem+env(safe-area-inset-bottom))]',
              !isDesktop && mobileMapActive && 'translate-x-full opacity-0 pointer-events-none',
            )}
          >
            <DemoBanner />
            <ErrorBoundary FallbackComponent={RouteErrorFallback} resetKeys={[location.pathname]}>
              <DebugCrashTrigger target="route" />
              <Outlet />
            </ErrorBoundary>
          </main>
          <Dock />
        </>
      ) : (
        <main data-layout="main" className="relative z-10 p-6 pt-18 w-full mx-auto max-w-2xl">
          <OnboardingPage />
        </main>
      )}
      <ImportProgressOverlay />
    </div>
  );
};
