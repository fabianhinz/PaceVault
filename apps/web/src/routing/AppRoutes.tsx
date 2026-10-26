import type { FC } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout.tsx';
import { DashboardPage } from '@/pages/DashboardPage.tsx';
import { SessionsPage } from '@/pages/SessionsPage.tsx';
import { SessionDetailPage } from '@/pages/SessionDetailPage.tsx';
import { TripDetailPage } from '@/pages/TripDetailPage.tsx';
import { StudioDetailPage } from '@/pages/StudioDetailPage.tsx';
import { SettingsPage } from '@/pages/SettingsPage.tsx';
import { LabsPage } from '@/pages/LabsPage.tsx';
import { PAGE_PATTERNS, pageUrl } from './pageRegistry.ts';

export const AppRoutes: FC = () => (
  <Routes>
    <Route element={<AppLayout />}>
      <Route index element={<DashboardPage />} />
      <Route path={PAGE_PATTERNS.sessions} element={<SessionsPage />} />
      <Route path={PAGE_PATTERNS.sessionDetail} element={<SessionDetailPage />} />
      <Route path={PAGE_PATTERNS.tripDetail} element={<TripDetailPage />} />
      <Route path={PAGE_PATTERNS.studioDetail} element={<StudioDetailPage />} />
      <Route path={PAGE_PATTERNS.labs} element={<LabsPage />} />
      <Route path={PAGE_PATTERNS.settings} element={<SettingsPage />} />
    </Route>

    <Route
      path="*"
      element={<Navigate to={pageUrl({ page: 'dashboard', params: {} })} replace />}
    />
  </Routes>
);
