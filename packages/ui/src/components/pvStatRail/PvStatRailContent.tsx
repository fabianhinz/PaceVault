import type { FC } from 'react';
import { PvTypography } from '../pvTypography/PvTypography.tsx';
import { cn } from '../../lib/cn.ts';
import type { StatRailRow } from './types.ts';

interface PvStatRailContentProps {
  header: string;
  rows: StatRailRow[];
  active: boolean;
  secondarySlot?: boolean;
}

export const PvStatRailContent: FC<PvStatRailContentProps> = (props) => (
  <div className="flex flex-col gap-2">
    <PvTypography
      variant="overline"
      as="p"
      noWrap
      tabularNums
      className={cn('min-h-4 leading-4', props.active && 'text-text-primary')}
    >
      {props.header}
    </PvTypography>
    {props.rows.map((row) => (
      <div key={row.key} className="min-w-0">
        {row.name !== undefined && (
          <div className="flex min-w-0 items-center gap-1">
            {row.color && (
              <span className="size-2 shrink-0 rounded-sm" style={{ backgroundColor: row.color }} />
            )}
            <PvTypography variant="caption" noWrap color="textTertiary">
              {row.name}
            </PvTypography>
            {row.info !== undefined && (
              <span
                className={cn(
                  'shrink-0 transition-opacity',
                  props.active && 'pointer-events-none opacity-0',
                )}
              >
                {row.info}
              </span>
            )}
          </div>
        )}
        <PvTypography variant="h3" as="p" noWrap tabularNums className="leading-tight">
          {row.value}
          {row.unit && (
            <PvTypography variant="caption" as="span" className="ml-0.5 font-normal">
              {row.unit}
            </PvTypography>
          )}
        </PvTypography>
        {(row.secondary !== undefined || props.secondarySlot) && (
          <PvTypography
            variant="caption"
            as="p"
            noWrap
            tabularNums
            color="textTertiary"
            className="min-h-4"
          >
            {row.secondary}
          </PvTypography>
        )}
      </div>
    ))}
  </div>
);
