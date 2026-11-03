import type { FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { FLOATING_PILL_CLASS } from '@pacevault/ui/lib/surfaces.ts';
import { tokens } from '@pacevault/ui/lib/tokens.ts';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { formatDate } from '@/lib/format/formatters.ts';

interface SegmentExplorerLegendProps {
  selectedDate: number;
  paired: boolean;
  sportColor: string;
}

export const SegmentExplorerLegend: FC<SegmentExplorerLegendProps> = (props) => (
  <div className="pointer-events-none sticky top-3 z-raised flex h-0 items-start justify-end">
    <span
      data-testid="explorer-legend"
      className={cn(FLOATING_PILL_CLASS, 'pointer-events-none mt-3 mr-3 gap-3 px-3 py-2')}
    >
      {props.paired && (
        <span className="flex min-w-0 items-center gap-1.5">
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: props.sportColor }}
          />
          <PvTypography variant="caption" color="textSecondary" tabularNums noWrap>
            {formatDate(props.selectedDate)}
          </PvTypography>
        </span>
      )}
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: tokens.best }} />
        <PvTypography variant="caption" color="textSecondary" noWrap>
          {m.ui_segment_best()}
        </PvTypography>
      </span>
    </span>
  </div>
);
