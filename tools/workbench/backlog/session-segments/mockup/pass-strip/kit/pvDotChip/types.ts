export type DotChipTone = 'neutral' | 'best';

export type DotChipLook = 'current' | 'tile' | 'underline' | 'pill' | 'columns' | 'glow';

export interface DotChipPosition {
  ratio: number;
  clamped: boolean;
}
