import type { FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { PvCard } from '@pacevault/ui/components/pvCard/PvCard.tsx';
import { PvCardHeader } from '@pacevault/ui/components/pvCardHeader/PvCardHeader.tsx';
import { Intervals } from '@/features/intervals/index.tsx';

export const IntegrationsCard: FC = () => (
  <PvCard>
    <PvCardHeader title={m.ui_integrations_title()} subtitle={m.ui_integrations_desc()} />
    <Intervals />
  </PvCard>
);
