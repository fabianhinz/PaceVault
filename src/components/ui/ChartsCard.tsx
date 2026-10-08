import { useDeferredValue, type ReactNode } from 'react';
import { ZoomOut, type LucideIcon } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { cn } from '@/lib/utils.ts';
import type { MetricId } from '@/lib/explanations.ts';
import { ListItemHeader } from './ListItemHeader.tsx';
import { GlassPill } from './GlassPill.tsx';

interface ChartsCardProps {
  zoomReset: ReactNode;
  children: ReactNode;
}

export const ChartsCard = (props: ChartsCardProps) => (
  <div className="relative isolate overflow-clip rounded-2xl border border-white/10">
    <div aria-hidden className="absolute inset-0 -z-10 bg-white/5 backdrop-blur-xl" />
    {props.zoomReset}
    <div className="divide-y divide-white/10">{props.children}</div>
  </div>
);

export const ZoomResetPill = (props: { isZoomed: boolean; onReset: () => void }) => {
  if (!props.isZoomed) return null;
  return (
    <div className="pointer-events-none sticky top-3 z-10 hidden h-0 items-start justify-end lg:flex">
      <GlassPill data-testid="zoom-reset-chip" className="mt-3 mr-3" onClick={props.onReset}>
        <ZoomOut size={16} />
        <span>{m.ui_chart_reset_zoom()}</span>
      </GlassPill>
    </div>
  );
};

interface ChartRowProps {
  title: string;
  secondary?: string;
  icon?: LucideIcon;
  color?: string;
  metricId?: MetricId;
  height?: string;
  rail?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

export const ChartRow = (props: ChartRowProps) => {
  const ready = useDeferredValue(true, false);
  const Icon = props.icon;

  return (
    <section aria-label={props.title}>
      <div className="flex min-h-[46px] items-center px-3 pt-2">
        <ListItemHeader
          variant="primary"
          avatar={Icon && <Icon size={16} style={{ color: props.color }} />}
          primary={props.title}
          metricId={props.metricId}
          secondary={props.secondary}
        />
      </div>
      <div className="px-3 pt-1 pb-3">
        <div
          className={cn(
            props.height ?? 'h-[140px]',
            props.rail !== undefined && 'grid grid-cols-[100px_minmax(0,1fr)] gap-3',
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
