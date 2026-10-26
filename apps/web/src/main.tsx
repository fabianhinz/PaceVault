import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ToastHost } from './components/ToastHost.tsx';
import { RootErrorFallback } from './components/RootErrorFallback.tsx';
import { App } from './App.tsx';
import { createQueryClient } from './lib/queryClient.ts';
import { AppRouter } from './routing/AppRouter.tsx';
import { installDebugTools } from './lib/debug/debug.ts';
import { DebugCrashTrigger } from './lib/debug/DebugCrashTrigger.tsx';
import { useUserStore } from './store/user.ts';
import { useSessionsStore } from './store/sessions.ts';
import { useTripsStore } from './store/trips.ts';
import { useStudioStore } from './store/studio.ts';
import { useCoachPlanStore } from './store/coachPlan.ts';
import { useLayoutStore } from './store/layout.ts';
import { useFiltersStore } from './store/filters.ts';
import { useIntervalsStore } from './store/intervals.ts';
import { useMapPreferencesStore } from './store/mapPreferences.ts';
import './index.css';

const boot = async (rootEl: HTMLElement) => {
  await installDebugTools();
  await Promise.all([
    useUserStore.persist.rehydrate(),
    useSessionsStore.persist.rehydrate(),
    useTripsStore.persist.rehydrate(),
    useStudioStore.persist.rehydrate(),
    useCoachPlanStore.persist.rehydrate(),
    useLayoutStore.persist.rehydrate(),
    useFiltersStore.persist.rehydrate(),
    useIntervalsStore.persist.rehydrate(),
    useMapPreferencesStore.persist.rehydrate(),
  ]);

  const queryClient = createQueryClient();

  createRoot(rootEl).render(
    <StrictMode>
      <ErrorBoundary FallbackComponent={RootErrorFallback}>
        <DebugCrashTrigger target="root" />
        <QueryClientProvider client={queryClient}>
          <AppRouter>
            <App />
            <ToastHost />
          </AppRouter>
          <ReactQueryDevtools buttonPosition="top-left" />
        </QueryClientProvider>
      </ErrorBoundary>
    </StrictMode>,
  );
};

const rootEl = document.getElementById('root');
if (rootEl) {
  boot(rootEl).catch((error: unknown) => {
    console.error(error);
    createRoot(rootEl).render(<RootErrorFallback error={error} />);
  });
}
