import { Children, useState, type ReactNode } from 'react';
import { CollapsibleHeader } from './Collapsible.tsx';
import { Typography } from './Typography.tsx';
import { tileClass } from './Card.tsx';
import { cn } from '@/lib/utils.ts';

interface CardGridProps {
  children: ReactNode;
  collapsedRows?: number;
  title: string;
}

export const CardGrid = (props: CardGridProps) => {
  const [expanded, setExpanded] = useState(false);
  const totalCount = Children.count(props.children);

  const maxVisible = props.collapsedRows !== undefined ? props.collapsedRows * 2 : totalCount;
  const needsToggle = props.collapsedRows !== undefined && totalCount > maxVisible;
  const visibleChildren =
    needsToggle && !expanded
      ? Children.toArray(props.children).slice(0, maxVisible)
      : props.children;

  return (
    <>
      {needsToggle ? (
        <h3 className="mb-4">
          <CollapsibleHeader
            open={expanded}
            onClick={() => setExpanded((prev) => !prev)}
            trailing={<Typography variant="caption">({totalCount})</Typography>}
            className="justify-between"
          >
            <Typography variant="title" as="span">
              {props.title}
            </Typography>
          </CollapsibleHeader>
        </h3>
      ) : (
        <div className="mb-4">
          <Typography variant="title" as="h3">
            {props.title}
          </Typography>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        {Children.map(visibleChildren, (child) =>
          child != null ? <div className={cn(tileClass, 'p-3')}>{child}</div> : null,
        )}
      </div>
    </>
  );
};
