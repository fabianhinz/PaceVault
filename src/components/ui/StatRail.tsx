import type { ReactNode } from 'react';
import { Typography } from './Typography.tsx';
import { MetricLabel } from './MetricLabel.tsx';
import { cn } from '@/lib/utils.ts';
import type { MetricId } from '@/lib/explanations.ts';

export interface StatRailRow {
  key: string;
  name?: string;
  color?: string;
  metricId?: MetricId;
  value: ReactNode;
  unit?: string;
  secondary?: ReactNode;
  note?: { text: string; color: string };
}

interface StatRailProps {
  header: string;
  rows: StatRailRow[];
  active: boolean;
}

export const StatRail = (props: StatRailProps) => (
  <div
    data-testid="stat-rail"
    className="flex h-full flex-col justify-center gap-2 overflow-hidden border-r border-white/10 pr-2"
  >
    <Typography
      variant="overline"
      as="p"
      noWrap
      tabularNums
      className={cn('min-h-4 leading-4', props.active && 'text-text-primary')}
    >
      {props.header}
    </Typography>
    {props.rows.map((row) => (
      <div key={row.key} className="min-w-0">
        {row.name !== undefined && (
          <div className="flex min-w-0 items-center gap-1">
            {row.color && (
              <span className="size-2 shrink-0 rounded-sm" style={{ backgroundColor: row.color }} />
            )}
            <Typography variant="caption" noWrap color="textTertiary">
              {row.name}
            </Typography>
            {row.metricId && (
              <span
                className={cn(
                  'shrink-0 transition-opacity',
                  props.active && 'pointer-events-none opacity-0',
                )}
              >
                <MetricLabel metricId={row.metricId} size="sm" iconOnly />
              </span>
            )}
          </div>
        )}
        <Typography variant="h3" as="p" noWrap tabularNums className="leading-tight">
          {row.value}
          {row.unit && (
            <Typography variant="caption" as="span" className="ml-0.5 font-normal">
              {row.unit}
            </Typography>
          )}
        </Typography>
        {row.secondary !== undefined && (
          <Typography variant="caption" as="p" noWrap tabularNums color="textTertiary">
            {row.secondary}
          </Typography>
        )}
        {row.note && (
          <Typography
            variant="caption"
            as="p"
            noWrap
            data-testid="stat-rail-note"
            style={{ color: row.note.color }}
          >
            {row.note.text}
          </Typography>
        )}
      </div>
    ))}
  </div>
);
