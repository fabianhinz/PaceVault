import type { FC } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { DemoBanner } from '@/components/layout/DemoBanner.tsx';
import { useCurrentPath } from '@/routing/useCurrentPath.ts';
import { PageOutlet } from '@/routing/PageOutlet.tsx';
import { RouteErrorFallback } from '@/components/RouteErrorFallback.tsx';
import { DebugCrashTrigger } from '@/lib/debug/DebugCrashTrigger.tsx';
import { OverviewMapControls } from '@/features/map/OverviewMapControls.tsx';

export const RouteContent: FC = () => {
  const currentPath = useCurrentPath();
  return (
    <>
      <DemoBanner />
      <ErrorBoundary FallbackComponent={RouteErrorFallback} resetKeys={[currentPath]}>
        <DebugCrashTrigger target="route" />
        <PageOutlet />
        <OverviewMapControls />
      </ErrorBoundary>
    </>
  );
};
