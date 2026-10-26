import { Info } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import { PvResponsivePopover } from '@pacevault/ui/components/pvResponsivePopover/PvResponsivePopover.tsx';
import { EXPLANATION_BY_METRIC, type MetricId } from '@/components/metricLabel/explanations.ts';
import { ExplanationBody } from '@/components/metricLabel/ExplanationBody.tsx';
import { useUserStore } from '@/store/user.ts';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import type { FC, ReactNode } from 'react';

interface MetricLabelProps {
  metricId: MetricId;
  relatedMetricIds?: MetricId[];
  size?: 'default' | 'sm';
  showValue?: ReactNode;
  className?: string;
  contextLabel?: string;
  iconOnly?: boolean;
  alwaysShowLabel?: boolean;
}

export const MetricLabel: FC<MetricLabelProps> = (props) => {
  const explanation = EXPLANATION_BY_METRIC[props.metricId];
  const related = (props.relatedMetricIds ?? []).map((id) => EXPLANATION_BY_METRIC[id]);
  const showHelp = useUserStore((s) => s.profile?.showMetricHelp ?? true);
  const size = props.size ?? 'default';

  const hideShortLabel =
    size === 'sm' &&
    props.contextLabel !== undefined &&
    explanation.shortLabel !== undefined &&
    explanation.shortLabel.localeCompare(props.contextLabel, undefined, {
      sensitivity: 'base',
    }) === 0;

  let labelContent: ReactNode = null;
  if (props.iconOnly) {
    labelContent = null;
  } else if (size === 'default') {
    labelContent = (
      <>
        <PvTypography variant="subtitle2">{explanation.friendlyName}</PvTypography>
        {explanation.shortLabel && (
          <PvTypography variant="caption" color="textTertiary">
            ({explanation.shortLabel})
          </PvTypography>
        )}
      </>
    );
  } else if (explanation.shortLabel && !hideShortLabel) {
    labelContent = <PvTypography variant="caption">{explanation.shortLabel}</PvTypography>;
  }

  return (
    <span className={cn('inline-flex items-center gap-1', props.className)}>
      <span
        className={cn(
          props.alwaysShowLabel && 'contents',
          !props.alwaysShowLabel && 'hidden sm:contents',
        )}
      >
        {labelContent}

        {props.showValue && (
          <PvTypography variant="subtitle1" as="span">
            {props.showValue}
          </PvTypography>
        )}
      </span>

      {showHelp && (
        <PvResponsivePopover
          closeLabel={m.ui_sheet_drag_close()}
          title={explanation.friendlyName}
          chip={explanation.shortLabel}
          side="top"
          trigger={
            <PvButton
              variant="ghost"
              size="icon"
              className="cursor-help text-text-quaternary hover:text-accent focus-visible:text-accent"
              aria-label={m.ui_learn_about({ metric: explanation.friendlyName })}
              aria-haspopup="dialog"
            >
              <Info size={size === 'sm' ? 14 : 16} strokeWidth={1.5} className="shrink-0" />
            </PvButton>
          }
        >
          <div className="space-y-3">
            <ExplanationBody explanation={explanation} primary />
            {related.map((entry) => (
              <ExplanationBody key={entry.id} explanation={entry} primary={false} />
            ))}
          </div>
        </PvResponsivePopover>
      )}
    </span>
  );
};
