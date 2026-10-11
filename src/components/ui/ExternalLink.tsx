import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface ExternalLinkProps {
  href: string;
  icon: LucideIcon;
  children: ReactNode;
}

export const ExternalLink = (props: ExternalLinkProps) => (
  <div className="flex gap-1 align-center text-accent">
    <props.icon size={16} strokeWidth={1.5} className="shrink-0" />
    <a
      href={props.href}
      target="_blank"
      rel="noreferrer"
      className="cursor-pointer hover:underline"
    >
      {props.children}
    </a>
  </div>
);
