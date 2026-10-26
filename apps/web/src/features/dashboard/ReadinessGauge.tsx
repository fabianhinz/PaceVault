import type { FC } from 'react';
import { useMetrics } from '@/features/dashboard/hooks/useMetrics.ts';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { tokens } from '@pacevault/ui/lib/tokens.ts';
import { statusTextClass, statusFill } from '@/lib/statusColors.ts';
import { MetricLabel } from '@/components/MetricLabel.tsx';
import { PvGaugeDial } from '@pacevault/ui/components/pvGaugeDial/PvGaugeDial.tsx';
import { MISSING } from '@/lib/railFormat.ts';
import { LABEL_BY_FORM_STATUS } from '@/microcopy/trainingLoad.ts';

const TSB_MIN = -40;
const TSB_MAX = 40;

const TSB_ZONES = [
  { from: -40, to: -30, color: tokens.statusDangerStrong },
  { from: -30, to: -10, color: tokens.accent },
  { from: -10, to: 5, color: tokens.statusNeutral },
  { from: 5, to: 25, color: tokens.statusSuccessStrong },
  { from: 25, to: 40, color: tokens.statusWarning },
];

export const ReadinessGauge: FC = () => {
  const metrics = useMetrics();
  const tsb = metrics.current?.tsb;
  const status = metrics.coaching.status;

  // Without history there is no form: `--`, an empty dial and no status label.
  let shown = MISSING;
  if (tsb !== undefined) shown = `${tsb > 0 ? '+' : ''}${tsb.toFixed(1)}`;

  return (
    <div className="w-28 flex gap-1 flex-1 h-full flex-col items-center justify-end">
      <div className="relative w-full max-w-160px">
        <PvGaugeDial
          min={TSB_MIN}
          max={TSB_MAX}
          value={tsb ?? TSB_MIN}
          zones={TSB_ZONES}
          valueFill={statusFill[status]}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-end">
          <PvTypography
            variant="h1"
            className={cn(
              'leading-none pb-1',
              tsb === undefined ? 'text-text-tertiary' : statusTextClass[status],
            )}
          >
            {shown}
          </PvTypography>
        </div>
      </div>
      {tsb !== undefined && (
        <PvTypography
          variant="overline"
          as="p"
          className={cn('whitespace-nowrap', statusTextClass[status])}
        >
          {LABEL_BY_FORM_STATUS[status]()}
        </PvTypography>
      )}
      <MetricLabel metricId="tsb" size="sm" />
    </div>
  );
};
