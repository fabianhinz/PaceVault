import type { MouseHandlerDataParam } from 'recharts/types/synchronisation/types';

const renderNothing = () => null;

export const hoverOnlyTooltip = { content: renderNothing, isAnimationActive: false } as const;

export const chartHoverHandlers = (onChange: ((x: number | null) => void) | undefined) => {
  if (!onChange) return {};
  return {
    onMouseLeave: () => onChange(null),
    onTouchMove: (e: MouseHandlerDataParam) => {
      if (e.activeLabel != null) onChange(Number(e.activeLabel));
    },
    onTouchEnd: () => onChange(null),
  };
};

export const indexByX = <K extends string, T extends Record<K, number | string>>(
  data: T[],
  key: K,
): Map<number | string, T> => new Map(data.map((d) => [d[key], d]));
