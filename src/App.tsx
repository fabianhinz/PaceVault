import { Routes, Route, Navigate } from 'react-router-dom';
import { useStoresHydrated } from './lib/hooks/useHydrated.ts';
import { AppLayout } from './components/layout/AppLayout.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { SessionsPage } from './pages/SessionsPage.tsx';
import { SessionDetailPage } from './pages/SessionDetailPage.tsx';
import { TripDetailPage } from './pages/TripDetailPage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';
import { LabsPage } from './pages/LabsPage.tsx';
import { enableMapSet } from 'immer';
import { useEffect } from 'react';
import { useFiltersStore } from './store/filters.ts';

enableMapSet();

export const App = () => {
  const hydrated = useStoresHydrated();

  useEffect(() => {
    if (hydrated) {
      useFiltersStore.getState().recomputePBs();
    }
  }, [hydrated]);

  if (!hydrated) return null;

  return (
    <>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="/sessions" element={<SessionsPage />} />
          <Route path="/sessions/:id" element={<SessionDetailPage />} />
          <Route path="/trips/:id" element={<TripDetailPage />} />
          <Route path="/labs" element={<LabsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};
