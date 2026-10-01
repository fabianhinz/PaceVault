import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ToastViewport } from './components/ui/Toast.tsx';
import { RootErrorFallback } from './components/ui/ErrorFallbacks.tsx';
import { App } from './App.tsx';
import { installDebugTools } from './lib/debug/debug.ts';
import { DebugCrashTrigger } from './lib/debug/DebugCrashTrigger.tsx';
import { useUserStore } from './store/user.ts';
import { useSessionsStore } from './store/sessions.ts';
import { useTripsStore } from './store/trips.ts';
import { useStudioStore } from './store/studio.ts';
import { useCoachPlanStore } from './store/coachPlan.ts';
import { useLayoutStore } from './store/layout.ts';
import { useFiltersStore } from './store/filters.ts';
import { useLapOptionsStore } from './store/lapOptions.ts';
import { useIntervalsStore } from './store/intervals.ts';
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
    useLapOptionsStore.persist.rehydrate(),
    useIntervalsStore.persist.rehydrate(),
  ]);

  const queryClient = new QueryClient();

  createRoot(rootEl).render(
    <StrictMode>
      <ErrorBoundary FallbackComponent={RootErrorFallback}>
        <DebugCrashTrigger target="root" />
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
            <ToastViewport />
          </BrowserRouter>
          <ReactQueryDevtools />
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
