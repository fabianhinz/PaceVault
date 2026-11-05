import { useState, type FC, type ReactNode } from 'react';
import { PvCollapsibleHeader } from '../pvCollapsibleHeader/PvCollapsibleHeader.tsx';
import { PvListItemHeader } from '../pvListItemHeader/PvListItemHeader.tsx';
import { PvCollapsibleContent } from './PvCollapsibleContent.tsx';

interface PvCollapsibleListItemProps {
  avatar: ReactNode;
  primary: ReactNode;
  secondary?: ReactNode;
  disabled?: boolean;
  testId?: string;
  children?: ReactNode;
}

export const PvCollapsibleListItem: FC<PvCollapsibleListItemProps> = (props) => {
  const [open, setOpen] = useState(false);

  if (props.disabled) {
    return (
      <div data-testid={props.testId}>
        <div
          aria-disabled="true"
          className="flex w-full cursor-default items-center py-2 pr-3 pl-3"
        >
          <PvListItemHeader
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
      <PvCollapsibleHeader
        open={open}
        onClick={() => setOpen((prev) => !prev)}
        className="justify-between rounded-2xl py-2 pr-2 pl-3"
      >
        <PvListItemHeader
          variant="secondary"
          avatar={props.avatar}
          primary={props.primary}
          secondary={props.secondary}
          disabled={props.disabled}
        />
      </PvCollapsibleHeader>
      <PvCollapsibleContent open={open}>
        <div className="px-3 pt-1 pb-3">{props.children}</div>
      </PvCollapsibleContent>
    </div>
  );
};
