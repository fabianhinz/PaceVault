import { m } from '@pacevault/i18n/messages.js';
import { useMetrics } from '@/lib/hooks/useMetrics.ts';
import { Typography } from '@pacevault/ui/components/Typography.tsx';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { acwrColorMap, acwrFill, ACWR_ZONES } from '@/lib/statusColors.ts';
import { getACWRColor, getInjuryRisk } from '@pacevault/engine/coaching.ts';
import { MetricLabel } from '@/components/MetricLabel.tsx';
import { GaugeDial } from '@pacevault/ui/components/GaugeDial.tsx';
import type { InjuryRisk } from '@pacevault/engine/types.ts';
import { MISSING } from '@/lib/railFormat.ts';

const acwrRiskLabel: Record<InjuryRisk, () => string> = {
  low: m.ui_acwr_risk_low,
  moderate: m.ui_acwr_risk_moderate,
  high: m.ui_acwr_risk_high,
};

const ACWR_MIN = 0;
const ACWR_MAX = 2;

export const ACWRGauge = () => {
  const metrics = useMetrics();
  const acwr = metrics.current?.acwr;
  // Without history there is no ratio: `--`, an empty dial and no risk label.
  const dialValue = acwr ?? ACWR_MIN;
  const color = getACWRColor(dialValue);

  return (
    <div className="w-28 flex gap-1 flex-1 h-full flex-col items-center justify-end">
      <div className="relative w-full max-w-[160px]">
        <GaugeDial
          min={ACWR_MIN}
          max={ACWR_MAX}
          value={dialValue}
          zones={ACWR_ZONES}
          valueFill={acwrFill[color]}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-end">
          <Typography
            variant="h1"
            className={cn(
              'leading-none pb-1',
              acwr === undefined ? 'text-text-tertiary' : acwrColorMap[color].text,
            )}
          >
            {acwr === undefined ? MISSING : acwr.toFixed(1)}
          </Typography>
        </div>
      </div>
      {acwr !== undefined && (
        <Typography
          variant="overline"
          as="p"
          className={cn('whitespace-nowrap', acwrColorMap[color].text)}
        >
          {acwrRiskLabel[getInjuryRisk(acwr)]()}
        </Typography>
      )}
      <MetricLabel metricId="acwr" size="sm" />
    </div>
  );
};
