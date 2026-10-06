import { ZoomOut } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { cn } from '@/lib/utils.ts';
import { glassClass } from './Card.tsx';

export const ZoomResetChip = (props: { onReset: () => void }) => (
  <div className="pointer-events-none sticky top-3 z-20 h-0">
    <div className="absolute top-3 right-3">
      <button
        type="button"
        data-testid="zoom-reset-chip"
        onClick={props.onReset}
        className={cn(
          glassClass,
          'pointer-events-auto inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5',
          'text-xs text-text-primary transition-colors hover:bg-white/10',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        )}
      >
        <ZoomOut size={14} />
        <span>{m.ui_chart_reset_zoom()}</span>
      </button>
    </div>
  </div>
);
