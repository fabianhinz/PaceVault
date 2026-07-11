import { Info } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { ResponsivePopover } from './ResponsivePopover.tsx';
import { METRIC_EXPLANATIONS, type MetricId } from '@/lib/explanations.ts';
import { useUserStore } from '@/store/user.ts';
import { cn } from '@/lib/utils.ts';
import { Button } from './Button.tsx';
import { Typography } from './Typography.tsx';
import type { ReactNode } from 'react';

interface MetricLabelProps {
  metricId: MetricId;
  size?: 'default' | 'sm';
  showValue?: ReactNode;
  className?: string;
  contextLabel?: string;
}

export const MetricLabel = (props: MetricLabelProps) => {
  const explanation = METRIC_EXPLANATIONS[props.metricId];
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
  if (size === 'default') {
    labelContent = (
      <>
        <Typography variant="subtitle2">{explanation.friendlyName}</Typography>
        {explanation.shortLabel && (
          <Typography variant="caption" color="textTertiary">
            ({explanation.shortLabel})
          </Typography>
        )}
      </>
    );
  } else if (explanation.shortLabel && !hideShortLabel) {
    labelContent = <Typography variant="caption">{explanation.shortLabel}</Typography>;
  }

  return (
    <span className={cn('inline-flex items-center gap-1', props.className)}>
      <span className="hidden sm:contents">
        {labelContent}

        {props.showValue && (
          <Typography variant="subtitle1" as="span">
            {props.showValue}
          </Typography>
        )}
      </span>

      {showHelp && (
        <ResponsivePopover
          title={explanation.friendlyName}
          side="top"
          className="space-y-2"
          trigger={
            <Button
              variant="ghost"
              size="icon"
              className="cursor-help text-text-quaternary hover:text-accent focus-visible:text-accent"
              aria-label={m.ui_learn_about({ metric: explanation.friendlyName })}
              aria-haspopup="dialog"
            >
              <Info size={size === 'sm' ? 14 : 16} strokeWidth={1.5} className="shrink-0" />
            </Button>
          }
        >
          <div className="flex items-baseline gap-2">
            <Typography variant="subtitle1" className="font-semibold">
              {explanation.friendlyName}
            </Typography>
            {explanation.shortLabel && (
              <Typography variant="caption" className="rounded bg-white/10 px-1.5 py-0.5">
                {explanation.shortLabel}
              </Typography>
            )}
          </div>

          <Typography>{explanation.oneLiner}</Typography>

          <Typography
            variant="caption"
            as="p"
            color="textTertiary"
            className="border-t border-white/10 pt-2"
          >
            {explanation.range}
          </Typography>
        </ResponsivePopover>
      )}
    </span>
  );
};
