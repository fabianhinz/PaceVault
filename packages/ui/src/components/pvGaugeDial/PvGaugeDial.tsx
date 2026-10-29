import type { FC } from 'react';
import { PvGaugeArcs } from './PvGaugeArcs.tsx';
import type { GaugeZone } from './types.ts';

const DIAL_CENTER_X = 100;
const DIAL_CENTER_Y = 100;
const DIAL_RADIUS = 83;
const DIAL_STROKE = 14;
const DIAL_ZONE_GAP_DEG = 1;

interface PvGaugeDialProps {
  min: number;
  max: number;
  value: number;
  zones: GaugeZone[];
  valueFill: string;
}

export const PvGaugeDial: FC<PvGaugeDialProps> = (props) => (
  <svg viewBox="0 0 200 115" className="w-full h-full">
    <PvGaugeArcs
      cx={DIAL_CENTER_X}
      cy={DIAL_CENTER_Y}
      radius={DIAL_RADIUS}
      stroke={DIAL_STROKE}
      gapDeg={DIAL_ZONE_GAP_DEG}
      min={props.min}
      max={props.max}
      value={props.value}
      zones={props.zones}
      valueFill={props.valueFill}
    />
  </svg>
);
