import { useMemo, type FC } from 'react';
import { Gauge } from 'lucide-react';
import { PvCollapsibleListItem } from '@pacevault/ui/components/pvCollapsibleListItem/PvCollapsibleListItem.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { ctlOnDate } from '@/components/sessions/session/sessionFitness.ts';
import { formatNumber } from '@/lib/format/formatters.ts';
import { useUserStore } from '@/store/user.ts';
import { useThresholdsAt } from '@/components/settings/hooks/useThresholdsAt.ts';
import { useMetrics } from '@/components/dashboard/hooks/useMetrics.ts';
import { m } from '@pacevault/i18n/messages.js';
import {
  trainingEffectFromRecords,
  trainingEffectLabel,
  trainingEffectSummary,
} from '@pacevault/engine/trainingEffect.ts';
import {
  localizedTELabel,
  localizedTESummary,
} from '@/components/sessions/session/localizedTrainingEffect.ts';
import type { SessionRecord, TrainingSession } from '@pacevault/engine/types.ts';
import { TrainingEffectGauge } from '@/components/sessions/session/TrainingEffectGauge.tsx';
import { TrainingEffectGlyph } from '@/components/sessions/session/TrainingEffectGlyph.tsx';

interface TrainingEffectCardProps {
  records: SessionRecord[];
  session: TrainingSession;
}

export const TrainingEffectCard: FC<TrainingEffectCardProps> = (props) => {
  const profile = useUserStore((s) => s.profile);
  const thresholds = useThresholdsAt(props.session.date);
  const metrics = useMetrics();
  const ctl = ctlOnDate({ history: metrics.history, timestamp: props.session.date });

  const te = useMemo(() => {
    if (!thresholds) return undefined;
    return trainingEffectFromRecords({ records: props.records, thresholds, ctl });
  }, [props.records, thresholds, ctl]);

  if (!profile) {
    return (
      <PvCollapsibleListItem
        testId="training-effect-row"
        disabled
        avatar={<Gauge size={24} aria-hidden className="text-text-tertiary" />}
        primary={m.ui_te_title()}
        secondary={m.ui_te_no_profile()}
      />
    );
  }

  if (!te) {
    return (
      <PvCollapsibleListItem
        testId="training-effect-row"
        disabled
        avatar={<Gauge size={24} aria-hidden className="text-text-tertiary" />}
        primary={m.ui_te_unavailable()}
        secondary={m.ui_te_no_hr()}
      />
    );
  }

  return (
    <PvCollapsibleListItem
      testId="training-effect-row"
      avatar={<TrainingEffectGlyph aerobic={te.aerobic} anaerobic={te.anaerobic} />}
      primary={`${localizedTELabel(trainingEffectLabel(te.aerobic))} · ${localizedTELabel(trainingEffectLabel(te.anaerobic))}`}
      secondary={m.ui_te_values({
        aerobic: formatNumber(te.aerobic, 'fixed-one-decimal'),
        anaerobic: formatNumber(te.anaerobic, 'fixed-one-decimal'),
      })}
    >
      <div className="flex items-start justify-center gap-6">
        <TrainingEffectGauge value={te.aerobic} metricId="aerobicTE" />
        <TrainingEffectGauge value={te.anaerobic} metricId="anaerobicTE" />
      </div>
      <div className="border-t border-white/10 mt-4 pt-3">
        <PvTypography variant="caption" as="p">
          {localizedTESummary(
            trainingEffectSummary({ aerobic: te.aerobic, anaerobic: te.anaerobic }),
          )}
        </PvTypography>
      </div>
    </PvCollapsibleListItem>
  );
};
