import type { FC } from 'react';
import { Wedges } from '@/components/sessions/session/Wedges.tsx';

interface WindRoseGlyphProps {
  shares: number[];
  size: number;
}

export const WindRoseGlyph: FC<WindRoseGlyphProps> = (props) => {
  const center = props.size / 2;
  const outer = center - 1;
  return (
    <svg
      width={props.size}
      height={props.size}
      viewBox={`0 0 ${props.size} ${props.size}`}
      aria-hidden
      className="shrink-0"
    >
      <circle cx={center} cy={center} r={outer} className="fill-white/5" />
      <Wedges shares={props.shares} center={center} inner={0} outer={outer} />
    </svg>
  );
};
