export const SHEET_SPRING = { type: 'spring', stiffness: 400, damping: 40 } as const;

export const SHEET_MOMENTUM = {
  power: 0.3,
  timeConstant: 200,
  bounceStiffness: 400,
  bounceDamping: 40,
};

const DISMISS_OFFSET_RATIO = 0.3;
const DISMISS_VELOCITY = 500;

interface DragMetrics {
  offset: number;
  velocity: number;
  height: number;
}

export const shouldDismiss = (metrics: DragMetrics): boolean => {
  if (metrics.offset > DISMISS_OFFSET_RATIO * metrics.height) {
    return true;
  }
  return metrics.velocity > DISMISS_VELOCITY;
};
