import type { FC } from 'react';
import { useRouterParam } from '@/routing/useRouterParam.ts';
import { m } from '@pacevault/i18n/messages.js';
import { useStudioStore } from '@/store/studio.ts';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { StudioDetail } from '@/features/studio/StudioDetail.tsx';

export const StudioDetailPage: FC = () => {
  const id = useRouterParam('id');
  const route = useStudioStore((s) => s.routes.find((r) => r.id === id));

  if (!route) {
    return (
      <PvTypography variant="body1" color="textSecondary">
        {m.ui_studio_not_found()}
      </PvTypography>
    );
  }

  return <StudioDetail route={route} />;
};
