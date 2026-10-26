import type { FC, MouseEvent, ReactNode } from 'react';
import { pageUrl, type PageTarget } from './pageRegistry.ts';
import { usePageRouting } from './usePageRouting.ts';

interface PageLinkProps {
  to: PageTarget;
  className?: string;
  onClick?: () => void;
  'aria-label'?: string;
  'aria-current'?: 'page';
  children: ReactNode;
}

const opensElsewhere = (event: MouseEvent<HTMLAnchorElement>): boolean =>
  event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;

export const PageLink: FC<PageLinkProps> = (props) => {
  const pageRouting = usePageRouting();
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    props.onClick?.();
    if (opensElsewhere(event)) return;
    event.preventDefault();
    pageRouting.open(props.to);
  };
  return (
    <a
      href={pageUrl(props.to)}
      className={props.className}
      onClick={handleClick}
      aria-label={props['aria-label']}
      aria-current={props['aria-current']}
    >
      {props.children}
    </a>
  );
};
