import { m } from '@/paraglide/messages.js';
import { useMetrics } from '@/hooks/useMetrics.ts';
import { Card } from '@/components/ui/Card.tsx';
import { CardHeader } from '@/components/ui/CardHeader.tsx';
import { Typography } from '@/components/ui/Typography.tsx';
import { getFormMessageDetailed } from '@/lib/coachingMessages.ts';
import { ReadinessGauge } from '@/features/dashboard/ReadinessGauge';
import { ACWRGauge } from '@/features/dashboard/ACWRGauge';

export const FormStatusCard = () => {
  const metrics = useMetrics();

  return (
    <Card
      footer={
        <Typography variant="caption" as="p">
          {getFormMessageDetailed(metrics.coaching)}
        </Typography>
      }
    >
      <CardHeader
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
    </Card>
  );
};
