import type { FC } from 'react';
import { Crown } from 'lucide-react';

export const BestMark: FC = () => (
  <>
    <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] bg-best/3" />
    <span
      role="img"
      aria-label="Best"
      className="pointer-events-none absolute -top-2 left-0 z-raised grid size-3.5 -rotate-15 place-items-center text-best drop-shadow-sm"
    >
      <Crown size={14} fill="currentColor" strokeWidth={1.5} aria-hidden />
    </span>
  </>
);
