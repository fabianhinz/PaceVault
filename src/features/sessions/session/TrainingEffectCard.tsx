import { useMemo } from 'react';
import { Gauge } from 'lucide-react';
import { CollapsibleListItem } from '@/components/ui/Collapsible.tsx';
import { Typography } from '@/components/ui/Typography.tsx';
import { GaugeArcs, GaugeDial } from '@/components/ui/GaugeDial.tsx';
import { MetricLabel } from '@/components/ui/MetricLabel.tsx';
import { METRIC_EXPLANATIONS, type MetricId } from '@/lib/explanations.ts';
import { tokens } from '@/lib/tokens.ts';
import { cn } from '@/lib/utils.ts';
import { ctlOnDate } from '@/lib/sessionFitness.ts';
import { useUserStore } from '@/store/user.ts';
import { useMetrics } from '@/hooks/useMetrics.ts';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import {
  calculateTrainingEffect,
  getTrainingEffectLabel,
  getTrainingEffectSummary,
} from '@/packages/engine/trainingEffect.ts';
import { localizedTELabel, localizedTESummary } from '@/lib/localizedTrainingEffect.ts';
import type { SessionRecord, TrainingSession } from '@/packages/engine/types.ts';

const TE_ZONES = [
  { from: 0, to: 1, color: tokens.statusNeutral },
  { from: 1, to: 2, color: tokens.accent },
  { from: 2, to: 3, color: tokens.statusSuccessStrong },
  { from: 3, to: 4, color: tokens.statusWarningStrong },
  { from: 4, to: 5, color: tokens.chartCadence },
];

const TE_FILL: Record<string, string> = {
  neutral: tokens.statusNeutral,
  blue: tokens.accent,
  green: tokens.statusSuccessStrong,
  amber: tokens.statusWarningStrong,
  orange: tokens.chartCadence,
  red: tokens.statusDangerStrong,
};

const TE_TEXT: Record<string, string> = {
  neutral: 'text-text-tertiary',
  blue: 'text-accent',
  green: 'text-status-success',
  amber: 'text-status-warning',
  orange: 'text-chart-cadence',
  red: 'text-status-danger',
};

const teFmt = new Intl.NumberFormat(getLocale(), {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const loadFmt = new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 0 });

const fillOf = (value: number) => TE_FILL[getTrainingEffectLabel(value).color] ?? '';

const TrainingEffectGlyph = (props: { aerobic: number; anaerobic: number }) => (
  <svg width={30} height={30} viewBox="0 0 30 30" aria-hidden>
    <GaugeArcs
      cx={15}
      cy={22}
      radius={13}
      stroke={3.5}
      gapDeg={4}
      min={0}
      max={5}
      value={props.aerobic}
      zones={TE_ZONES}
      valueFill={fillOf(props.aerobic)}
    />
    <GaugeArcs
      cx={15}
      cy={22}
      radius={7.5}
      stroke={3.5}
      gapDeg={6}
      min={0}
      max={5}
      value={props.anaerobic}
      zones={TE_ZONES}
      valueFill={fillOf(props.anaerobic)}
    />
  </svg>
);

const TrainingEffectGauge = (props: { value: number; metricId: MetricId }) => {
  const label = getTrainingEffectLabel(props.value);
  const textClass = TE_TEXT[label.color] ?? '';
  return (
    <div className="w-28">
      <div className="flex flex-col items-center gap-1">
        <div className="relative w-full max-w-[160px]">
          <GaugeDial
            min={0}
            max={5}
            value={props.value}
            zones={TE_ZONES}
            valueFill={fillOf(props.value)}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-end">
            <Typography variant="h1" className={cn('leading-none pb-1', textClass)}>
              {teFmt.format(props.value)}
            </Typography>
          </div>
        </div>
        <Typography
          variant="overline"
          as="p"
          className={cn('min-h-8 max-w-full text-center text-balance', textClass)}
        >
          {localizedTELabel(label.label)}
        </Typography>
        <MetricLabel metricId={props.metricId} size="sm" alwaysShowLabel />
      </div>
    </div>
  );
};

type TrainingEffectCardProps = {
  records: SessionRecord[];
  session: TrainingSession;
};

export const TrainingEffectCard = (props: TrainingEffectCardProps) => {
  const profile = useUserStore((s) => s.profile);
  const metrics = useMetrics();
  const ctl = ctlOnDate(metrics.history, props.session.date);

  const te = useMemo(() => {
    if (!profile) return undefined;
    return calculateTrainingEffect(
      props.records,
      profile.thresholds.maxHr,
      profile.thresholds.restHr,
      profile.gender,
      ctl,
    );
  }, [props.records, profile, ctl]);

  const load = METRIC_EXPLANATIONS[props.session.stressMethod];
  const loadValue = loadFmt.format(props.session.tss);

  if (!profile) {
    return (
      <CollapsibleListItem
        testId="training-effect-row"
        disabled
        avatar={<Gauge size={24} aria-hidden className="text-text-tertiary" />}
        primary={`${load.friendlyName} ${loadValue}`}
        secondary={m.ui_te_no_profile()}
      />
    );
  }

  if (!te) {
    return (
      <CollapsibleListItem
        testId="training-effect-row"
        disabled
        avatar={<Gauge size={24} aria-hidden className="text-text-tertiary" />}
        primary={m.ui_te_unavailable()}
        secondary={m.ui_te_no_hr()}
      />
    );
  }

  return (
    <CollapsibleListItem
      testId="training-effect-row"
      avatar={<TrainingEffectGlyph aerobic={te.aerobic} anaerobic={te.anaerobic} />}
      primary={`${localizedTELabel(getTrainingEffectLabel(te.aerobic).label)} · ${localizedTELabel(getTrainingEffectLabel(te.anaerobic).label)}`}
      secondary={m.ui_te_values({
        aerobic: teFmt.format(te.aerobic),
        anaerobic: teFmt.format(te.anaerobic),
        method: load.shortLabel ?? load.friendlyName,
        load: loadValue,
      })}
    >
      <div className="flex items-start justify-center gap-6">
        <TrainingEffectGauge value={te.aerobic} metricId="aerobicTE" />
        <TrainingEffectGauge value={te.anaerobic} metricId="anaerobicTE" />
      </div>
      <div className="border-t border-white/10 mt-4 pt-3">
        <Typography variant="caption" as="p">
          {localizedTESummary(getTrainingEffectSummary(te.aerobic, te.anaerobic))}
        </Typography>
      </div>
    </CollapsibleListItem>
  );
};
