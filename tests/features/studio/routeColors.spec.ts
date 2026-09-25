import { describe, it, expect } from 'vitest';
import { nextRouteColor, routeColorOrder } from '@/features/studio/routeColors.ts';

describe('nextRouteColor', () => {
  it('starts with fuchsia when no route exists', () => {
    expect(nextRouteColor([])).toBe('fuchsia');
  });

  it('walks the palette in order while colours are free', () => {
    expect(nextRouteColor(['fuchsia'])).toBe('emerald');
    expect(nextRouteColor(['fuchsia', 'emerald'])).toBe('amber');
  });

  it('wraps around once every colour is taken', () => {
    expect(nextRouteColor([...routeColorOrder])).toBe('fuchsia');
  });

  it('reuses the colour a deleted route freed up', () => {
    expect(nextRouteColor(['fuchsia', 'amber', 'violet', 'orange', 'rose'])).toBe('emerald');
  });

  it('picks the least-used colour after manual recolouring', () => {
    const used = [...routeColorOrder, 'fuchsia', 'emerald', 'amber', 'violet', 'rose'] as const;
    expect(nextRouteColor([...used])).toBe('orange');
  });
});
