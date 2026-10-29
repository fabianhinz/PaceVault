import { useDeferredValue, type FC, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn.ts';
import type { TokenColor } from '../../lib/tokens.ts';
import { PvListItemHeader } from '../pvListItemHeader/PvListItemHeader.tsx';

type ChartRowSize = 'compact' | 'tall';

const CLASSES_BY_CHART_ROW_SIZE: Record<ChartRowSize, string> = {
  compact: 'h-140px',
  tall: 'h-64',
};

interface PvChartRowProps {
  title: string;
  secondary?: string;
  icon?: LucideIcon;
  color?: TokenColor;
  info?: ReactNode;
  size?: ChartRowSize;
  rail?: ReactNode;
  above?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

export const PvChartRow: FC<PvChartRowProps> = (props) => {
  const ready = useDeferredValue(true, false);
  const Icon = props.icon;

  return (
    <section aria-label={props.title}>
      <div className="flex min-h-46px items-center px-3 pt-2">
        <PvListItemHeader
          variant="primary"
          avatar={Icon && <Icon size={16} style={{ color: props.color }} />}
          primary={props.title}
          info={props.info}
          secondary={props.secondary}
        />
      </div>
      <div className="px-3 pt-1 pb-3">
        {props.above}
        <div
          className={cn(
            CLASSES_BY_CHART_ROW_SIZE[props.size ?? 'compact'],
            props.rail !== undefined && 'grid grid-cols-chart-rail gap-3',
          )}
        >
          {props.rail}
          <div className="h-full min-h-0 min-w-0">{ready && props.children}</div>
        </div>
        {props.footer}
      </div>
    </section>
  );
};
