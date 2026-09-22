import { createPortal } from 'react-dom';
import { m } from '@/paraglide/messages.js';
import { Typography } from '@/components/ui/Typography.tsx';

const SIZE = 180;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface IntervalsImportOverlayProps {
  processed: number;
  total: number;
}

export const IntervalsImportOverlay = (props: IntervalsImportOverlayProps) => {
  let fraction = 0;
  if (props.total > 0) fraction = Math.min(props.processed / props.total, 1);

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="fixed inset-0 z-50 grid place-items-center bg-surface-base/85 backdrop-blur-sm"
    >
      <div className="grid place-items-center gap-6">
        <Typography variant="subtitle1">{m.ui_intervals_importing()}</Typography>

        <div className="relative" style={{ width: SIZE, height: SIZE }}>
          <svg width={SIZE} height={SIZE} className="-rotate-90">
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              strokeWidth={STROKE}
              className="stroke-white/10"
            />
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
              className="stroke-accent transition-[stroke-dashoffset] duration-300"
            />
          </svg>

          <div className="absolute inset-0 grid place-items-center">
            <Typography variant="h3" tabularNums>
              {m.ui_intervals_progress({ processed: props.processed, total: props.total })}
            </Typography>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
