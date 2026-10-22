import { defineConfig } from '@vite-pwa/assets-generator/config';
import type { Preset } from '@vite-pwa/assets-generator/config';
import { SURFACE_BASE } from '@pacevault/ui/lib/colors.ts';

const preset: Preset = {
  transparent: {
    sizes: [64, 192, 512],
    favicons: [[48, 'favicon.ico']],
  },
  maskable: {
    sizes: [512],
    resizeOptions: {
      background: SURFACE_BASE,
    },
  },
  apple: {
    sizes: [180],
    resizeOptions: {
      background: SURFACE_BASE,
    },
  },
};

export default defineConfig({
  preset,
  images: ['public/logo.svg'],
});
