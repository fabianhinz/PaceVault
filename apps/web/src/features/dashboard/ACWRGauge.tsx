import type { FC } from 'react';
import { useMetrics } from '@/features/dashboard/hooks/useMetrics.ts';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { acwrColor, acwrColorMap, acwrFill, ACWR_ZONES } from '@/lib/statusColors.ts';
import { injuryRiskFromAcwr } from '@pacevault/engine/coaching.ts';
import { MetricLabel } from '@/components/MetricLabel.tsx';
import { PvGaugeDial } from '@pacevault/ui/components/pvGaugeDial/PvGaugeDial.tsx';
import { MISSING } from '@/lib/railFormat.ts';
import { LABEL_BY_INJURY_RISK } from '@/microcopy/trainingLoad.ts';

const ACWR_MIN = 0;
const ACWR_MAX = 2;

export const ACWRGauge: FC = () => {
  const metrics = useMetrics();
  const acwr = metrics.current?.acwr;
  // Without history there is no ratio: `--`, an empty dial and no risk label.
  const dialValue = acwr ?? ACWR_MIN;
  const color = acwrColor(dialValue);

  return (
    <div className="w-28 flex gap-1 flex-1 h-full flex-col items-center justify-end">
      <div className="relative w-full max-w-160px">
        <PvGaugeDial
          min={ACWR_MIN}
          max={ACWR_MAX}
          value={dialValue}
          zones={ACWR_ZONES}
          valueFill={acwrFill[color]}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-end">
          <PvTypography
            variant="h1"
            className={cn(
              'leading-none pb-1',
              acwr === undefined ? 'text-text-tertiary' : acwrColorMap[color].text,
            )}
          >
            {acwr === undefined ? MISSING : acwr.toFixed(1)}
          </PvTypography>
        </div>
      </div>
      {acwr !== undefined && (
        <PvTypography
          variant="overline"
          as="p"
          className={cn('whitespace-nowrap', acwrColorMap[color].text)}
        >
          {LABEL_BY_INJURY_RISK[injuryRiskFromAcwr(acwr)]()}
        </PvTypography>
      )}
      <MetricLabel metricId="acwr" size="sm" />
    </div>
  );
};
