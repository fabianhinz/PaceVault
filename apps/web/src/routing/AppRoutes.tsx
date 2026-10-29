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
import { PATTERN_BY_PAGE, pageUrl } from './pageRegistry.ts';

export const AppRoutes: FC = () => (
  <Routes>
    <Route element={<AppLayout />}>
      <Route index element={<DashboardPage />} />
      <Route path={PATTERN_BY_PAGE.sessions} element={<SessionsPage />} />
      <Route path={PATTERN_BY_PAGE.sessionDetail} element={<SessionDetailPage />} />
      <Route path={PATTERN_BY_PAGE.tripDetail} element={<TripDetailPage />} />
      <Route path={PATTERN_BY_PAGE.studioDetail} element={<StudioDetailPage />} />
      <Route path={PATTERN_BY_PAGE.labs} element={<LabsPage />} />
      <Route path={PATTERN_BY_PAGE.settings} element={<SettingsPage />} />
    </Route>

    <Route
      path="*"
      element={<Navigate to={pageUrl({ page: 'dashboard', params: {} })} replace />}
    />
  </Routes>
);
