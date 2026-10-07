import { useState, type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils.ts';
import { ListItemHeader } from './ListItemHeader.tsx';

interface CollapsibleHeaderProps {
  open: boolean;
  onClick: () => void;
  trailing?: ReactNode;
  className?: string;
  children: ReactNode;
}

export const CollapsibleHeader = (props: CollapsibleHeaderProps) => (
  <button
    type="button"
    aria-expanded={props.open}
    onClick={props.onClick}
    className={cn(
      'group flex w-full cursor-pointer items-center gap-2 text-left',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
      props.className,
    )}
  >
    {props.children}
    <span className="inline-flex shrink-0 items-center gap-1 rounded-lg p-1.5 text-text-secondary transition-colors group-hover:bg-white/10 group-hover:text-text-primary">
      {props.trailing}
      <ChevronRight
        aria-hidden
        className={cn('size-4 transition-transform', props.open && 'rotate-90')}
      />
    </span>
  </button>
);

interface CollapsibleContentProps {
  open: boolean;
  children: ReactNode;
}

const CollapsibleContent = (props: CollapsibleContentProps) => (
  <div
    inert={!props.open}
    className={cn(
      'grid transition-[grid-template-rows] duration-250 ease-out',
      props.open && 'grid-rows-[1fr]',
      !props.open && 'grid-rows-[0fr]',
    )}
  >
    <div className="min-h-0 overflow-hidden">{props.children}</div>
  </div>
);

interface CollapsibleListItemProps {
  avatar: ReactNode;
  primary: ReactNode;
  secondary?: ReactNode;
  disabled?: boolean;
  testId?: string;
  children?: ReactNode;
}

export const CollapsibleListItem = (props: CollapsibleListItemProps) => {
  const [open, setOpen] = useState(false);

  if (props.disabled) {
    return (
      <div data-testid={props.testId}>
        <div
          aria-disabled="true"
          className="flex w-full cursor-default items-center py-2 pr-3 pl-3"
        >
          <ListItemHeader
            variant="secondary"
            avatar={props.avatar}
            primary={props.primary}
            secondary={props.secondary}
            disabled={props.disabled}
          />
        </div>
      </div>
    );
  }

  return (
    <div data-testid={props.testId}>
      <CollapsibleHeader
        open={open}
        onClick={() => setOpen((prev) => !prev)}
        className="justify-between rounded-2xl py-2 pr-2 pl-3"
      >
        <ListItemHeader
          variant="secondary"
          avatar={props.avatar}
          primary={props.primary}
          secondary={props.secondary}
          disabled={props.disabled}
        />
      </CollapsibleHeader>
      <CollapsibleContent open={open}>
        <div className="px-3 pt-1 pb-3">{props.children}</div>
      </CollapsibleContent>
    </div>
  );
};
