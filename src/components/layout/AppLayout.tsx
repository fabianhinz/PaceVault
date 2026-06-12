import { cn } from '@/lib/utils.ts';
import { useLayoutStore } from '@/store/layout.ts';
import { MapBackground } from '@/features/map/MapBackground.tsx';
import { Dock } from './Dock.tsx';
import { DemoBanner } from './DemoBanner.tsx';
import { OnboardingPage } from '@/pages/OnboardingPage.tsx';
import { Outlet } from 'react-router-dom';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop.ts';

export const AppLayout = () => {
  const mobileMapActive = useLayoutStore((s) => s.mobileMapActive);
  const onboardingComplete = useLayoutStore((s) => s.onboardingComplete);
  const isDesktop = useIsDesktop();

  return (
    <div className="min-h-screen overflow-hidden">
      <MapBackground
        className={cn(
          'transition-all duration-300 ease-in-out',
          onboardingComplete &&
            !isDesktop &&
            !mobileMapActive &&
            'opacity-0 scale-95 pointer-events-none',
        )}
      />
      {onboardingComplete ? (
        <>
          <main
            data-layout="main"
            data-map-active={mobileMapActive || undefined}
            className={cn(
              'relative z-10 p-6 w-full transition-all duration-300 ease-in-out',
              'mx-auto max-w-[1280px] lg:pl-0 lg:ml-auto lg:mr-0 lg:max-w-[40dvw]',
              isDesktop ? 'pb-28' : 'pb-20',
              !isDesktop && mobileMapActive && 'translate-x-full opacity-0 pointer-events-none',
            )}
          >
            <DemoBanner />
            <Outlet />
          </main>
          <Dock />
        </>
      ) : (
        <main data-layout="main" className="relative z-10 p-6 pt-24 w-full mx-auto max-w-2xl">
          <OnboardingPage />
        </main>
      )}
    </div>
  );
};
