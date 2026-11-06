import type { FC } from 'react';
import { useRouterParam } from '@/routing/useRouterParam.ts';
import { m } from '@pacevault/i18n/messages.js';
import { useStudioStore } from '@/store/studio.ts';
import { NotFoundBanner } from '@/components/errors/NotFoundBanner.tsx';
import { StudioDetail } from '@/components/studio/StudioDetail.tsx';

export const Studio: FC = () => {
  const id = useRouterParam('id');
  const route = useStudioStore((s) => s.routes.find((r) => r.id === id));

  if (!route) {
    return <NotFoundBanner>{m.ui_studio_not_found()}</NotFoundBanner>;
  }

  return <StudioDetail route={route} />;
};
