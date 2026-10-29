import type { FC } from 'react';
import { MIN_SUMMARY_LAPS, type LapSet } from '@/lib/analysis/laps.ts';
import { AvatarFrame } from './AvatarFrame.tsx';
import { Bars } from './Bars.tsx';
import { layoutStrip } from './lapStripLayout.ts';
import { tokens } from '@pacevault/ui/lib/tokens.ts';

interface LapStripAvatarProps {
  set: LapSet | null;
}

export const LapStripAvatar: FC<LapStripAvatarProps> = (props) => {
  if (!props.set || props.set.analysis.length < MIN_SUMMARY_LAPS) {
    return (
      <AvatarFrame>
        <line x1="4" x2="26" y1="15" y2="15" stroke={tokens.white30} strokeDasharray="2 2" />
      </AvatarFrame>
    );
  }
  const layout = layoutStrip({ set: props.set, width: 26, height: 24, gap: 0.8 });
  return (
    <AvatarFrame>
      <g transform="translate(2 3)">
        <line x1="0" x2="26" y1="12" y2="12" stroke={tokens.white25} strokeWidth={0.6} />
        <Bars bars={layout.bars} />
      </g>
    </AvatarFrame>
  );
};
