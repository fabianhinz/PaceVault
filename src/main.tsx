import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastViewport } from './components/ui/Toast.tsx';
import { App } from './App.tsx';
import { useUserStore } from './store/user.ts';
import { useSessionsStore } from './store/sessions.ts';
import { useTripsStore } from './store/trips.ts';
import { useStudioStore } from './store/studio.ts';
import { useCoachPlanStore } from './store/coachPlan.ts';
import { useLayoutStore } from './store/layout.ts';
import { useFiltersStore } from './store/filters.ts';
import { useLapOptionsStore } from './store/lapOptions.ts';
import './index.css';

const boot = async () => {
  // The stores are independent — rehydrate them concurrently instead of
  // serializing one IndexedDB round-trip per store at boot.
  await Promise.all([
    useUserStore.persist.rehydrate(),
    useSessionsStore.persist.rehydrate(),
    useTripsStore.persist.rehydrate(),
    useStudioStore.persist.rehydrate(),
    useCoachPlanStore.persist.rehydrate(),
    useLayoutStore.persist.rehydrate(),
    useFiltersStore.persist.rehydrate(),
    useLapOptionsStore.persist.rehydrate(),
  ]);

  const rootEl = document.getElementById('root');
  if (!rootEl) return;
  const queryClient = new QueryClient();

  createRoot(rootEl).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
          <ToastViewport />
        </BrowserRouter>
      </QueryClientProvider>
    </StrictMode>,
  );
};

boot();
