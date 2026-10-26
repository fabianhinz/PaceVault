import type { Locator } from '@playwright/test';

export type Clip = { x: number; y: number; width: number; height: number };

export const boxOf = async (locator: Locator) => {
  const box = await locator.boundingBox();
  if (!box) throw new Error('element has no box');
  return box;
};

export const padded = (box: Clip, padding: number): Clip => ({
  x: box.x - padding,
  y: box.y - padding,
  width: box.width + padding * 2,
  height: box.height + padding * 2,
});

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const isWithin = (outer: Clip, inner: Clip) =>
  inner.x >= outer.x &&
  inner.y >= outer.y &&
  inner.x + inner.width <= outer.x + outer.width &&
  inner.y + inner.height <= outer.y + outer.height;

export const spiral = ({
  centre,
  step,
  maxRadius,
}: {
  centre: { x: number; y: number };
  step: number;
  maxRadius: number;
}) => {
  const points: { x: number; y: number }[] = [centre];
  for (let radius = step; radius <= maxRadius; radius += step) {
    for (let offsetX = -radius; offsetX <= radius; offsetX += step) {
      points.push(
        { x: centre.x + offsetX, y: centre.y - radius },
        { x: centre.x + offsetX, y: centre.y + radius },
      );
    }
    for (let offsetY = -radius + step; offsetY <= radius - step; offsetY += step) {
      points.push(
        { x: centre.x - radius, y: centre.y + offsetY },
        { x: centre.x + radius, y: centre.y + offsetY },
      );
    }
  }
  return points;
};
