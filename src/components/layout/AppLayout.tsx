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
import { useDevice } from '@/lib/hooks/useDevice.ts';
import { useIntervalsSync } from '@/features/intervals/hooks/useIntervalsSync.ts';
import { ImportProgressOverlay } from '@/components/ui/ImportProgressOverlay.tsx';
import { useImportProgressStore } from '@/store/importProgress.ts';
import { useSessionReprocessingEffect } from '@/features/sessions/hooks/useSessionReprocessingEffect.ts';
import { useTrainingLoadRecomputeEffect } from '@/features/sessions/hooks/useTrainingLoadRecomputeEffect.ts';
import { useSessionReprocessingActive } from '@/features/sessions/hooks/useSessionReprocessingActive.ts';
import { NewerVersionOverlay } from './NewerVersionOverlay.tsx';
import { OverviewMapControls } from '@/features/map/OverviewMapControls.tsx';

const RouteContent = () => {
  const location = useLocation();
  return (
    <>
      <DemoBanner />
      <ErrorBoundary FallbackComponent={RouteErrorFallback} resetKeys={[location.pathname]}>
        <DebugCrashTrigger target="route" />
        <Outlet />
        <OverviewMapControls />
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
  const reprocessing = useSessionReprocessingActive();
  const reprocessOverlayOpen = useImportProgressStore((s) => s.foreground?.task === 'reprocess');
  const device = useDevice();
  const appMounted = onboardingComplete && !reprocessing && !reprocessOverlayOpen;

  useSessionReprocessingEffect();
  useTrainingLoadRecomputeEffect();
  useIntervalsSync();

  return (
    <div className="min-h-screen overflow-clip">
      <ErrorBoundary
        fallback={null}
        onError={() => useImportProgressStore.getState().abandonTrackBuildAfterMapCrash()}
      >
        <DebugCrashTrigger target="map" />
        <MapBackground />
      </ErrorBoundary>
      {appMounted && device.isDesktop && (
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
      {appMounted && !device.isDesktop && (
        <BottomSheetProvider>
          <MobileSheet />
          <Dock />
        </BottomSheetProvider>
      )}
      {!onboardingComplete && <OnboardingPage />}
      <ImportProgressOverlay />
      <NewerVersionOverlay />
    </div>
  );
};
