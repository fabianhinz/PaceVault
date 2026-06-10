import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastViewport } from './components/ui/Toast.tsx';
import { App } from './App.tsx';
import { useUserStore } from './store/user.ts';
import { useSessionsStore } from './store/sessions.ts';
import { useCoachPlanStore } from './store/coachPlan.ts';
import { useLayoutStore } from './store/layout.ts';
import { useFiltersStore } from './store/filters.ts';
import './index.css';

const boot = async () => {
  await useUserStore.persist.rehydrate();
  await useSessionsStore.persist.rehydrate();
  await useCoachPlanStore.persist.rehydrate();
  await useLayoutStore.persist.rehydrate();
  await useFiltersStore.persist.rehydrate();

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
