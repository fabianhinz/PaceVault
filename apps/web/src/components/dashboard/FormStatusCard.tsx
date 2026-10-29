import type { FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { useMetrics } from '@/components/dashboard/hooks/useMetrics.ts';
import { PvCard } from '@pacevault/ui/components/pvCard/PvCard.tsx';
import { PvCardHeader } from '@pacevault/ui/components/pvCardHeader/PvCardHeader.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { getFormMessageDetailed } from '@/components/dashboard/coachingMessages.ts';
import { ReadinessGauge } from '@/components/dashboard/ReadinessGauge.tsx';
import { ACWRGauge } from '@/components/dashboard/ACWRGauge.tsx';

export const FormStatusCard: FC = () => {
  const metrics = useMetrics();

  return (
    <PvCard
      footer={
        <PvTypography variant="caption" as="p">
          {getFormMessageDetailed(metrics.coaching)}
        </PvTypography>
      }
    >
      <PvCardHeader
        title={m.ui_dashboard_current_form()}
        subtitle={m.ui_dashboard_current_form_subtitle()}
      />

      <div className="flex justify-center gap-6">
        <div className="w-28">
          <ReadinessGauge />
        </div>

        <div className="w-28">
          <ACWRGauge />
        </div>
      </div>
    </PvCard>
  );
};
