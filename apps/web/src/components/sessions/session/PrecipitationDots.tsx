import type { FC } from 'react';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { tokens } from '@pacevault/ui/lib/tokens.ts';
import type { PrecipitationMark, PrecipitationType } from '@/lib/api/weather.ts';

const COLOR_BY_PRECIPITATION_TYPE: Record<PrecipitationType, string> = {
  rain: tokens.precipRain,
  freezing: tokens.precipFreezing,
  snow: tokens.precipSnow,
  thunderstorm: tokens.precipThunderstorm,
};

interface PrecipitationDotsProps {
  mark: PrecipitationMark;
}

export const PrecipitationDots: FC<PrecipitationDotsProps> = (props) => {
  const dots = props.mark.dots;
  if (dots === undefined) {
    return (
      <svg width={12} height={6} viewBox="0 0 12 6" aria-hidden className="stroke-text-tertiary">
        <path d="M0 3h5M7 3h5" strokeWidth={1.5} />
      </svg>
    );
  }
  if (dots === 0 || props.mark.type === undefined) return null;
  const color = COLOR_BY_PRECIPITATION_TYPE[props.mark.type];
  return (
    <svg width={14} height={4} viewBox="0 0 14 4" aria-hidden>
      {[0, 1, 2].map((index) => (
        <circle
          key={index}
          cx={2 + index * 5}
          cy={2}
          r={1.6}
          fill={index < dots ? color : undefined}
          className={cn(index >= dots && 'fill-white/15')}
        />
      ))}
    </svg>
  );
};
