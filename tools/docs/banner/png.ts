/// <reference lib="dom" />
import type { Page } from '@playwright/test';
import type { Clip } from './clip.ts';

const GEO_DOT_RGB: [number, number, number] = [80, 140, 255];
const GEO_DOT_COLOR_TOLERANCE = 24;

const openPngCanvas = async (png: Buffer, page: Page) => {
  const helper = await page.context().newPage();
  await helper.evaluate(async (base64Png) => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64Png}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    canvas.getContext('2d')?.drawImage(image, 0, 0);
    document.body.append(canvas);
  }, png.toString('base64'));
  return helper;
};

export const cropPng = async ({ png, cssClip }: { png: Buffer; cssClip: Clip }, page: Page) => {
  const clip = {
    x: Math.round(cssClip.x),
    y: Math.round(cssClip.y),
    width: Math.round(cssClip.width),
    height: Math.round(cssClip.height),
  };
  const scale = await page.evaluate(() => window.devicePixelRatio);
  const helper = await openPngCanvas(png, page);
  try {
    const dataUrl = await helper.evaluate(
      (input) => {
        const source = document.querySelector('canvas');
        const target = document.createElement('canvas');
        target.width = Math.round(input.clip.width * input.scale);
        target.height = Math.round(input.clip.height * input.scale);
        const context = target.getContext('2d');
        if (!source || !context) throw new Error('no canvas');
        context.drawImage(
          source,
          Math.round(input.clip.x * input.scale),
          Math.round(input.clip.y * input.scale),
          target.width,
          target.height,
          0,
          0,
          target.width,
          target.height,
        );
        return target.toDataURL('image/png');
      },
      { clip, scale },
    );
    return Buffer.from(dataUrl.replace(/^data:image\/png;base64,/, ''), 'base64');
  } finally {
    await helper.close();
  }
};

export const findPositionDot = async (page: Page) => {
  const scale = await page.evaluate(() => window.devicePixelRatio);
  const helper = await openPngCanvas(await page.screenshot(), page);
  try {
    const centre = await helper.evaluate(
      (dot) => {
        const canvas = document.querySelector('canvas');
        const context = canvas?.getContext('2d');
        if (!canvas || !context) throw new Error('no canvas');
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
        let sumX = 0;
        let sumY = 0;
        let count = 0;
        for (let i = 0; i < pixels.length; i += 4) {
          const distance =
            Math.abs((pixels[i] ?? 0) - dot.rgb[0]) +
            Math.abs((pixels[i + 1] ?? 0) - dot.rgb[1]) +
            Math.abs((pixels[i + 2] ?? 0) - dot.rgb[2]);
          if (distance > dot.tolerance) continue;
          sumX += (i / 4) % canvas.width;
          sumY += Math.floor(i / 4 / canvas.width);
          count++;
        }
        if (count === 0) return null;
        return { x: sumX / count, y: sumY / count };
      },
      { rgb: GEO_DOT_RGB, tolerance: GEO_DOT_COLOR_TOLERANCE },
    );
    if (!centre) throw new Error('live-position dot not found on the map');
    return { x: centre.x / scale, y: centre.y / scale };
  } finally {
    await helper.close();
  }
};
