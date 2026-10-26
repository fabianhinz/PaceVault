import type { FC, ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';
import { PvButton } from '../pvButton/PvButton.tsx';
import { PvTypography } from '../pvTypography/PvTypography.tsx';

interface PvListItemProps {
  primary: ReactNode;
  secondary?: ReactNode;
  children?: ReactNode;
  icon?: ReactNode;
  onClick?: () => void;
}

export const PvListItem: FC<PvListItemProps> = (props) => {
  const content = (
    <>
      <div className="flex items-center gap-3 min-w-0">
        {props.icon && <div className="shrink-0 text-primary">{props.icon}</div>}
        <div className="min-w-0">
          <PvTypography>{props.primary}</PvTypography>
          {props.secondary && (
            <PvTypography variant="caption" as="p">
              {props.secondary}
            </PvTypography>
          )}
        </div>
      </div>
      {props.children && <div className="ml-auto text-right shrink-0">{props.children}</div>}
    </>
  );

  const baseClass = 'flex gap-2 w-full items-center justify-between';

  if (props.onClick) {
    return (
      <li>
        <PvButton
          variant="ghost"
          onClick={props.onClick}
          className={cn(baseClass, 'h-auto text-left')}
        >
          {content}
        </PvButton>
      </li>
    );
  }

  return <li className={baseClass}>{content}</li>;
};
