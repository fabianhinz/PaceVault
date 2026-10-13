import { Fragment, type CSSProperties, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { MetricId } from '@/lib/explanations.ts';
import { cn } from '@/lib/utils.ts';
import { tileClass } from './Card.tsx';
import { MetricLabel } from './MetricLabel.tsx';
import { Typography } from './Typography.tsx';

interface StatReadingProps {
  value: string;
  lead?: string;
  unit?: string;
}

type StatTileAction =
  | { metricId?: MetricId; relatedMetricIds?: MetricId[]; onClick?: never }
  | { onClick: () => void; metricId?: never; relatedMetricIds?: never };

type StatTileProps = StatReadingProps &
  StatTileAction & {
    title: string;
    icon?: { icon: LucideIcon; color: string };
    required?: boolean;
    active?: boolean;
    secondary?: StatReadingProps;
    note?: ReactNode;
    style?: CSSProperties;
    children?: ReactNode;
  };

const StatReading = (props: StatReadingProps) => (
  <Typography variant="h3" as="p" tabularNums noWrap>
    {props.lead !== undefined && (
      <Typography variant="caption" className="mr-0.5 font-normal">
        {props.lead}
      </Typography>
    )}
    {props.value}
    {props.unit !== undefined && (
      <Typography variant="caption" className="ml-0.5 font-normal">
        {props.unit}
      </Typography>
    )}
  </Typography>
);

export const IconFact = (props: { icon: LucideIcon; label: string; time: string }) => (
  <span title={props.label} className="inline-flex items-center gap-1 align-top">
    <props.icon size={12} strokeWidth={2} aria-hidden className="shrink-0" />
    <span className="sr-only">{props.label}</span>
    {props.time}
  </span>
);

export const Crumbs = (props: { items: ReactNode[] }) => (
  <>
    {props.items.map((item, i) => (
      <Fragment key={i}>
        {i > 0 && ' · '}
        <span className="whitespace-nowrap">{item}</span>
      </Fragment>
    ))}
  </>
);

export const StatTile = (props: StatTileProps) => {
  const hasChart = props.children !== undefined;
  const Root = props.onClick === undefined ? 'div' : 'button';
  const TitleIcon = props.icon?.icon;
  return (
    <Root
      type={props.onClick === undefined ? undefined : 'button'}
      onClick={props.onClick}
      data-stat={props.metricId}
      style={props.style}
      className={cn(
        tileClass,
        'grid min-w-0 grid-cols-[minmax(0,1fr)_auto] grid-rows-[16px_28px_32px] gap-y-1 p-2',
        props.onClick !== undefined && 'cursor-pointer text-left hover:bg-white/10',
      )}
    >
      <div className="flex min-w-0 items-center gap-1.5">
        {TitleIcon !== undefined && (
          <TitleIcon size={12} aria-hidden className="shrink-0" color={props.icon?.color} />
        )}
        <Typography variant="overline" noWrap className={cn(props.active && 'text-text-primary')}>
          {props.title}
          {props.required && (
            <span aria-hidden className="ml-0.5">
              *
            </span>
          )}
        </Typography>
      </div>
      {props.metricId !== undefined && (
        <MetricLabel
          metricId={props.metricId}
          relatedMetricIds={props.relatedMetricIds}
          size="sm"
          iconOnly
          className="self-center"
        />
      )}
      <div className="col-span-2 col-start-1 row-start-2 flex min-w-0 items-baseline gap-1">
        <StatReading value={props.value} lead={props.lead} unit={props.unit} />
        {props.secondary !== undefined && (
          <StatReading
            value={props.secondary.value}
            lead={props.secondary.lead}
            unit={props.secondary.unit}
          />
        )}
        {hasChart && props.secondary === undefined && props.note !== undefined && (
          <Typography
            variant="caption"
            color="textTertiary"
            tabularNums
            noWrap
            zeroMinWidth
            className="flex-1"
          >
            {props.note}
          </Typography>
        )}
      </div>
      {hasChart && (
        <div className="col-span-2 row-start-3 flex min-w-0 items-center">{props.children}</div>
      )}
      {!hasChart && props.note !== undefined && (
        <Typography
          variant="caption"
          as="p"
          color="textTertiary"
          tabularNums
          className="col-span-2 row-start-3 line-clamp-2"
        >
          {props.note}
        </Typography>
      )}
    </Root>
  );
};
