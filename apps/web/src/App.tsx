import type { FC } from 'react';
import { enableMapSet } from 'immer';
import { useStoresHydrated } from './store/hooks/useStoresHydrated.ts';
import { AppRoutes } from './routing/AppRoutes.tsx';

enableMapSet();

export const App: FC = () => {
  const hydrated = useStoresHydrated();

  if (!hydrated) return null;

  return <AppRoutes />;
};
