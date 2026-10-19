import { m } from '@pacevault/i18n/messages.js';
import { useMetrics } from '@/hooks/useMetrics.ts';
import { Typography } from '@pacevault/ui/components/Typography.tsx';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { tokens } from '@pacevault/ui/lib/tokens.ts';
import { statusTextClass, statusFill } from '@/lib/statusColors.ts';
import { MetricLabel } from '@/components/MetricLabel.tsx';
import { GaugeDial } from '@pacevault/ui/components/GaugeDial.tsx';
import type { FormStatus } from '@pacevault/engine/types.ts';

const readinessLabel: Record<FormStatus, () => string> = {
  detraining: m.ui_readiness_detraining,
  fresh: m.ui_readiness_fresh,
  neutral: m.ui_readiness_neutral,
  optimal: m.ui_readiness_optimal,
  overload: m.ui_readiness_overload,
};

const TSB_ZONES = [
  { from: -40, to: -30, color: tokens.statusDangerStrong },
  { from: -30, to: -10, color: tokens.accent },
  { from: -10, to: 5, color: tokens.statusNeutral },
  { from: 5, to: 25, color: tokens.statusSuccessStrong },
  { from: 25, to: 40, color: tokens.statusWarning },
];

export const ReadinessGauge = () => {
  const metrics = useMetrics();
  const tsb = metrics.current?.tsb ?? 0;

  const coachingLabel = readinessLabel[metrics.coaching.status]();

  return (
    <div className="w-28 flex gap-1 flex-1 h-full flex-col items-center justify-end">
      <div className="relative w-full max-w-[160px]">
        <GaugeDial
          min={-40}
          max={40}
          value={tsb}
          zones={TSB_ZONES}
          valueFill={statusFill[metrics.coaching.status] ?? tokens.statusNeutral}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-end">
          <Typography
            variant="h1"
            className={cn('leading-none pb-1', statusTextClass[metrics.coaching.status])}
          >
            {tsb > 0 ? '+' : ''}
            {tsb.toFixed(1)}
          </Typography>
        </div>
      </div>
      <Typography
        variant="overline"
        as="p"
        className={cn('whitespace-nowrap', statusTextClass[metrics.coaching.status])}
      >
        {coachingLabel}
      </Typography>
      <MetricLabel metricId="tsb" size="sm" />
    </div>
  );
};
