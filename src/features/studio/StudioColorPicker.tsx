import { cn } from '@/lib/utils.ts';
import type { StudioRouteColor } from '@/store/studio.ts';
import { routeColorOrder, routeColors } from './routeColors.ts';

export const StudioColorPicker = (props: {
  value: StudioRouteColor;
  onChange: (color: StudioRouteColor) => void;
}) => {
  return (
    <div role="radiogroup" className="flex gap-3">
      {routeColorOrder.map((color) => {
        const selected = props.value === color;
        return (
          <button
            key={color}
            type="button"
            role="radio"
            aria-label={color}
            aria-checked={selected}
            onClick={() => props.onChange(color)}
            className={cn(
              'h-8 w-8 cursor-pointer rounded-full transition-all',
              selected
                ? 'ring-2 ring-white/80 ring-offset-2 ring-offset-surface-sunken'
                : 'opacity-50 hover:opacity-100',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-sunken',
            )}
            style={{ backgroundColor: routeColors[color].hex }}
          />
        );
      })}
    </div>
  );
};
