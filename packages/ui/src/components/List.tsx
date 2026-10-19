import type { ReactNode } from 'react';
import { cn } from '../lib/cn.ts';
import { Button } from './Button.tsx';
import { Typography } from './Typography.tsx';

type ListProps = {
  children: ReactNode;
  className?: string;
};

export const List = (props: ListProps) => (
  <ul className={cn('space-y-3', props.className)}>{props.children}</ul>
);

type ListItemProps = {
  primary: ReactNode;
  secondary?: ReactNode;
  children?: ReactNode;
  icon?: ReactNode;
  onClick?: () => void;
};

export const ListItem = (props: ListItemProps) => {
  const content = (
    <>
      <div className="flex items-center gap-3 min-w-0">
        {props.icon && <div className="shrink-0 text-primary">{props.icon}</div>}
        <div className="min-w-0">
          <Typography>{props.primary}</Typography>
          {props.secondary && (
            <Typography variant="caption" as="p">
              {props.secondary}
            </Typography>
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
        <Button
          variant="ghost"
          onClick={props.onClick}
          className={cn(baseClass, 'h-auto text-left')}
        >
          {content}
        </Button>
      </li>
    );
  }

  return <li className={baseClass}>{content}</li>;
};
