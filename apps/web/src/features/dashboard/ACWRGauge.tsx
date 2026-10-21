import { m } from '@pacevault/i18n/messages.js';
import { useMetrics } from '@/lib/hooks/useMetrics.ts';
import { Typography } from '@pacevault/ui/components/Typography.tsx';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { acwrColorMap, acwrFill, ACWR_ZONES } from '@/lib/statusColors.ts';
import { getACWRColor, getInjuryRisk } from '@pacevault/engine/coaching.ts';
import { MetricLabel } from '@/components/MetricLabel.tsx';
import { GaugeDial } from '@pacevault/ui/components/GaugeDial.tsx';
import type { InjuryRisk } from '@pacevault/engine/types.ts';

const acwrRiskLabel: Record<InjuryRisk, () => string> = {
  low: m.ui_acwr_risk_low,
  moderate: m.ui_acwr_risk_moderate,
  high: m.ui_acwr_risk_high,
};

export const ACWRGauge = () => {
  const metrics = useMetrics();
  const acwr = metrics.current?.acwr ?? 0;
  const color = getACWRColor(acwr);
  const risk = getInjuryRisk(acwr);

  return (
    <div className="w-28 flex gap-1 flex-1 h-full flex-col items-center justify-end">
      <div className="relative w-full max-w-[160px]">
        <GaugeDial min={0} max={2} value={acwr} zones={ACWR_ZONES} valueFill={acwrFill[color]} />
        <div className="absolute inset-0 flex flex-col items-center justify-end">
          <Typography variant="h1" className={cn('leading-none pb-1', acwrColorMap[color].text)}>
            {acwr.toFixed(1)}
          </Typography>
        </div>
      </div>
      <Typography
        variant="overline"
        as="p"
        className={cn('whitespace-nowrap', acwrColorMap[color].text)}
      >
        {acwrRiskLabel[risk]()}
      </Typography>
      <MetricLabel metricId="acwr" size="sm" contextLabel="asd" />
    </div>
  );
};
