import { describe, it, expect } from 'vitest';
import { nextRouteColor, routeColorOrder } from '@/features/studio/routeColors.ts';

describe('nextRouteColor', () => {
  it('walks the palette in order while colours are free', () => {
    expect(nextRouteColor(['fuchsia'])).toBe('emerald');
    expect(nextRouteColor(['fuchsia', 'emerald'])).toBe('amber');
  });

  it('picks the least-used colour after manual recolouring', () => {
    const used = [...routeColorOrder, 'fuchsia', 'emerald', 'amber', 'violet', 'rose'] as const;
    expect(nextRouteColor([...used])).toBe('orange');
  });
});
