import { useEffect } from 'react';
import { cn } from '@/lib/utils.ts';
import { useLayoutStore } from '@/store/layout.ts';
import { MapBackground } from '@/features/map/MapBackground.tsx';
import { Dock } from './Dock.tsx';
import { DemoBanner } from './DemoBanner.tsx';
import { OnboardingPage } from '@/pages/OnboardingPage.tsx';
import { Outlet, useLocation } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { RouteErrorFallback } from '@/components/ui/ErrorFallbacks.tsx';
import { BottomSheet, BottomSheetProvider } from '@/components/ui/BottomSheet.tsx';
import { DebugCrashTrigger } from '@/lib/debug/DebugCrashTrigger.tsx';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop.ts';
import { useIntervalsSync } from '@/features/intervals/hooks/useIntervalsSync.ts';
import { ImportProgressOverlay } from '@/components/ui/ImportProgressOverlay.tsx';

const RouteContent = () => {
  const location = useLocation();
  return (
    <>
      <DemoBanner />
      <ErrorBoundary FallbackComponent={RouteErrorFallback} resetKeys={[location.pathname]}>
        <DebugCrashTrigger target="route" />
        <Outlet />
      </ErrorBoundary>
    </>
  );
};

const MobileSheet = () => {
  const position = useLayoutStore((s) => s.mobileSheetPosition);

  useEffect(() => {
    const root = document.documentElement;
    root.style.overscrollBehavior = 'none';
    return () => {
      root.style.overscrollBehavior = '';
    };
  }, []);

  return (
    <BottomSheet
      position={position}
      onPositionChange={(next) => useLayoutStore.getState().setMobileSheetPosition(next)}
    >
      <main data-layout="main" className="relative pb-6">
        <RouteContent />
      </main>
    </BottomSheet>
  );
};

export const AppLayout = () => {
  const onboardingComplete = useLayoutStore((s) => s.onboardingComplete);
  const isDesktop = useIsDesktop();

  useIntervalsSync();

  return (
    <div className="min-h-screen overflow-hidden">
      <ErrorBoundary fallback={null}>
        <DebugCrashTrigger target="map" />
        <MapBackground />
      </ErrorBoundary>
      {onboardingComplete && isDesktop && (
        <>
          <main
            data-layout="main"
            className={cn(
              'relative z-10 p-6 pb-28 w-full',
              'pt-[calc(env(safe-area-inset-top)+1.5rem)]',
              'pl-0 ml-auto mr-0 max-w-[40dvw]',
              'pr-[max(1.5rem,env(safe-area-inset-right))]',
            )}
          >
            <RouteContent />
          </main>
          <Dock />
        </>
      )}
      {onboardingComplete && !isDesktop && (
        <BottomSheetProvider>
          <MobileSheet />
          <Dock />
        </BottomSheetProvider>
      )}
      {!onboardingComplete && (
        <main data-layout="main" className="relative z-10 p-6 pt-18 w-full mx-auto max-w-2xl">
          <OnboardingPage />
        </main>
      )}
      <ImportProgressOverlay />
    </div>
  );
};
