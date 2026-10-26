import type { FC } from 'react';
import { PvGaugeArcs } from '@pacevault/ui/components/pvGaugeDial/PvGaugeArcs.tsx';
import { TE_ZONES, fillOf } from '@/features/sessions/session/trainingEffectScale.ts';

interface TrainingEffectGlyphProps {
  aerobic: number;
  anaerobic: number;
}

export const TrainingEffectGlyph: FC<TrainingEffectGlyphProps> = (props) => (
  <svg width={30} height={30} viewBox="0 0 30 30" aria-hidden>
    <PvGaugeArcs
      cx={15}
      cy={22}
      radius={13}
      stroke={3.5}
      gapDeg={4}
      min={0}
      max={5}
      value={props.aerobic}
      zones={TE_ZONES}
      valueFill={fillOf(props.aerobic)}
    />
    <PvGaugeArcs
      cx={15}
      cy={22}
      radius={7.5}
      stroke={3.5}
      gapDeg={6}
      min={0}
      max={5}
      value={props.anaerobic}
      zones={TE_ZONES}
      valueFill={fillOf(props.anaerobic)}
    />
  </svg>
);
