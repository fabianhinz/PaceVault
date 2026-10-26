import type { FC } from 'react';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { useLayoutStore } from '@/store/layout.ts';
import { MapBackground } from '@/components/mapBackground/index.tsx';
import { Dock } from './Dock.tsx';
import { OnboardingPage } from '@/pages/OnboardingPage.tsx';
import { ErrorBoundary } from 'react-error-boundary';
import { PvBottomSheetProvider } from '@pacevault/ui/components/pvBottomSheet/PvBottomSheetProvider.tsx';
import { DebugCrashTrigger } from '@/lib/debug/DebugCrashTrigger.tsx';
import { useDevice } from '@pacevault/ui/hooks/useDevice.ts';
import { useIntervalsSync } from '@/queries/intervals/useIntervalsSync.ts';
import { ImportProgress } from '@/components/importProgress/index.tsx';
import { useImportProgressStore } from '@/store/importProgress.ts';
import { useOutdatedSessionsReprocessing } from '@/queries/sessions/useOutdatedSessionsReprocessing.ts';
import { useTrainingLoadRecompute } from '@/queries/sessions/useTrainingLoadRecompute.ts';
import { useSessionReprocessingActive } from '@/store/hooks/useSessionReprocessingActive.ts';
import { NewerVersionOverlay } from './NewerVersionOverlay.tsx';
import { MobileSheet } from '@/components/layout/MobileSheet.tsx';
import { RouteContent } from '@/components/layout/RouteContent.tsx';

export const AppLayout: FC = () => {
  const onboardingComplete = useLayoutStore((s) => s.onboardingComplete);
  const reprocessing = useSessionReprocessingActive();
  const reprocessOverlayOpen = useImportProgressStore((s) => s.foreground?.task === 'reprocess');
  const device = useDevice();
  const appMounted = onboardingComplete && !reprocessing && !reprocessOverlayOpen;

  useOutdatedSessionsReprocessing();
  useTrainingLoadRecompute();
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
      {appMounted && device.desktop && (
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
      {appMounted && !device.desktop && (
        <PvBottomSheetProvider>
          <MobileSheet />
          <Dock />
        </PvBottomSheetProvider>
      )}
      {!onboardingComplete && <OnboardingPage />}
      <ImportProgress />
      <NewerVersionOverlay />
    </div>
  );
};
