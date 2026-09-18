import type { ImportRange } from '@/lib/intervals/intervalsDates.ts';

export const intervalsKeys = {
  all: ['intervals'] as const,
  preview: (range: ImportRange) => ['intervals', 'preview', range] as const,
};
