import { Fragment, type CSSProperties, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { MetricId } from '@/lib/explanations.ts';
import { cn } from '@/lib/utils.ts';
import { tileClass } from './Card.tsx';
import { MetricLabel } from './MetricLabel.tsx';
import { Typography } from './Typography.tsx';

interface StatReadingProps {
  value: string;
  unit?: string;
}

type StatTileAction =
  | { metricId?: MetricId; relatedMetricIds?: MetricId[]; onClick?: never }
  | { onClick: () => void; metricId?: never; relatedMetricIds?: never };

type StatTileProps = StatReadingProps &
  StatTileAction & {
    title: string;
    icon?: { icon: LucideIcon; color: string };
    secondary?: StatReadingProps;
    note?: ReactNode;
    style?: CSSProperties;
    children?: ReactNode;
  };

const StatReading = (props: StatReadingProps) => (
  <Typography variant="h3" as="p" tabularNums noWrap>
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

// `wrap`: every crumb carries its own leading "·" in a fixed slot, and the row is shifted left by
// that slot inside an overflow-hidden box, so the separator of whichever crumb starts a line is clipped.
const WrappingCrumbs = (props: { items: ReactNode[] }) => (
  <span className="block min-w-0 overflow-hidden">
    <span className="-ml-3.5 flex flex-wrap items-center">
      {props.items.map((item, i) => (
        <span key={i} className="inline-flex items-center whitespace-nowrap">
          <span aria-hidden className="w-3.5 shrink-0 text-center">
            ·
          </span>
          {item}
        </span>
      ))}
    </span>
  </span>
);

export const Crumbs = (props: { items: ReactNode[]; wrap?: boolean }) => {
  if (props.wrap) return <WrappingCrumbs items={props.items} />;
  return (
    <>
      {props.items.map((item, i) => (
        <Fragment key={i}>
          {i > 0 && ' · '}
          <span className="whitespace-nowrap">{item}</span>
        </Fragment>
      ))}
    </>
  );
};

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
        <Typography variant="overline" noWrap>
          {props.title}
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
        <StatReading value={props.value} unit={props.unit} />
        {props.secondary !== undefined && (
          <StatReading value={props.secondary.value} unit={props.secondary.unit} />
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
