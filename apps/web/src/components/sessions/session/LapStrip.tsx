import type { FC } from 'react';
import type { LapSet } from '@/lib/analysis/laps.ts';
import { LapStripAvatar } from './LapStripAvatar.tsx';
import { LapStripDetail } from './LapStripDetail.tsx';

interface LapStripProps {
  set: LapSet | null;
  size: 'avatar' | 'detail';
}

export const LapStrip: FC<LapStripProps> = (props) => {
  if (props.size === 'avatar') return <LapStripAvatar set={props.set} />;
  if (!props.set) return null;
  return <LapStripDetail set={props.set} />;
};
