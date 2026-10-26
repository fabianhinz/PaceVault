import type { ReactNode } from 'react';
import type { TokenColor } from '../../lib/tokens.ts';

export interface StatRailRow {
  key: string;
  name?: string;
  color?: TokenColor;
  info?: ReactNode;
  value: ReactNode;
  unit?: string;
  secondary?: ReactNode;
}

export interface StatRailNote {
  text: string;
  color: string;
}
