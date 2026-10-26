import type { DatedValue } from '@pacevault/engine/types.ts';
import type { TokenColor } from '@pacevault/ui/lib/tokens.ts';
import type { ThresholdTileKey } from './thresholdIcons.ts';

export interface TileSpec {
  key: ThresholdTileKey;
  title: () => string;
  color: TokenColor;
  unit: string;
  format: (value: number) => string;
}

export interface TileScrub {
  key: ThresholdTileKey;
  date: number;
}

export interface ThresholdTileContext {
  firstSessionDate: number | undefined;
  createdAt: number;
  today: number;
}

export type ThresholdHistories = Record<ThresholdTileKey, DatedValue<number>[]>;
