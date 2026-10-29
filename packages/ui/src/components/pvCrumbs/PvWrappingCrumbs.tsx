import type { FC, ReactNode } from 'react';

interface PvWrappingCrumbsProps {
  items: ReactNode[];
}

export const PvWrappingCrumbs: FC<PvWrappingCrumbsProps> = (props) => (
  <span className="block min-w-0 overflow-hidden">
    <span className="-ml-3.5 flex flex-wrap items-center">
      {props.items.map((item, i) => (
        <span key={i} className="inline-flex items-center whitespace-nowrap">
          <span aria-hidden className="w-3.5 shrink-0 text-center">
            ·
          </span>
          {item}
        </span>
      ))}
    </span>
  </span>
);
