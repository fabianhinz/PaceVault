import type { LucideIcon } from 'lucide-react';
import type { FC, ReactNode, Ref } from 'react';

interface PvExternalLinkProps {
  href: string;
  icon: LucideIcon;
  children: ReactNode;
  ref?: Ref<HTMLSpanElement>;
}

export const PvExternalLink: FC<PvExternalLinkProps> = (props) => (
  <span ref={props.ref} className="flex text-xs gap-1 align-center text-accent">
    <props.icon size={16} strokeWidth={1.5} className="shrink-0" />
    <a
      href={props.href}
      target="_blank"
      rel="noreferrer"
      className="cursor-pointer hover:underline"
    >
      {props.children}
    </a>
  </span>
);
