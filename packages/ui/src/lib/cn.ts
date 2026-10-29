import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// tailwind-merge only knows Tailwind's default scale; the named theme tokens are listed here so a
// caller's class still overrides a kit class of the same property (e.g. `h-auto` over `h-80px`).
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      spacing: [
        '3px',
        '30px',
        '46px',
        '50px',
        '52px',
        '80px',
        '104px',
        '140px',
        '160px',
        '252px',
        '300px',
        '380px',
        '440px',
        'dock-footprint',
      ],
      radius: ['10px'],
      shadow: ['floating'],
    },
    classGroups: {
      z: [{ z: ['behind', 'raised', 'overlay', 'toast'] }],
      'grid-cols': [{ 'grid-cols': ['chart-rail'] }],
    },
  },
});

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};
