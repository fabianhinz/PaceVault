import type { FC } from 'react';
import type { LucideIcon } from 'lucide-react';

interface PvIconFactProps {
  icon: LucideIcon;
  label: string;
  time: string;
}

export const PvIconFact: FC<PvIconFactProps> = (props) => (
  <span title={props.label} className="inline-flex items-center gap-1 align-top">
    <props.icon size={12} strokeWidth={2} aria-hidden className="shrink-0" />
    <span className="sr-only">{props.label}</span>
    {props.time}
  </span>
);
