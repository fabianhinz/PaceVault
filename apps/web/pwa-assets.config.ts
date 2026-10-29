import { defineConfig } from '@vite-pwa/assets-generator/config';
import type { Preset } from '@vite-pwa/assets-generator/config';
import { tokens } from '@pacevault/ui/lib/tokens.ts';

const preset: Preset = {
  transparent: {
    sizes: [64, 192, 512],
    favicons: [[48, 'favicon.ico']],
  },
  maskable: {
    sizes: [512],
    resizeOptions: {
      background: tokens.surfaceBase,
    },
  },
  apple: {
    sizes: [180],
    resizeOptions: {
      background: tokens.surfaceBase,
    },
  },
};

export default defineConfig({
  preset,
  images: ['public/logo.svg'],
});
