import { Children, useState, type ReactNode, type FC } from 'react';
import { PvCollapsibleHeader } from '../pvCollapsibleHeader/PvCollapsibleHeader.tsx';
import { PvTypography } from '../pvTypography/PvTypography.tsx';

interface PvCardGridProps {
  children: ReactNode;
  collapsedRows?: number;
  title: string;
}

export const PvCardGrid: FC<PvCardGridProps> = (props) => {
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
          <PvCollapsibleHeader
            open={expanded}
            onClick={() => setExpanded((prev) => !prev)}
            trailing={<PvTypography variant="caption">({totalCount})</PvTypography>}
            className="justify-between"
          >
            <PvTypography variant="title" as="span">
              {props.title}
            </PvTypography>
          </PvCollapsibleHeader>
        </h3>
      ) : (
        <div className="mb-4">
          <PvTypography variant="title" as="h3">
            {props.title}
          </PvTypography>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">{visibleChildren}</div>
    </>
  );
};
