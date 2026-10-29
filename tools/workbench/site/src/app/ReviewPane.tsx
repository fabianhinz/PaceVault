import type { FC } from 'react';
import { cn } from '@pacevault/ui/lib/cn.ts';
import type { BoardItem } from '@site/lib/board.ts';
import { ReviewSections } from './ReviewSections.tsx';
import { Stage } from './Stage.tsx';

interface ReviewPaneProps {
  item: BoardItem;
  wide: boolean;
}

export const ReviewPane: FC<ReviewPaneProps> = (props) => {
  const item = props.item;
  if (!item.reviewDoc) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <ReviewSections item={item} />
      </div>
    );
  }
  const stage = (
    <Stage
      label="Review"
      path="review/index.html"
      className={cn(!props.wide && 'h-[420px] flex-none')}
      expandable
    >
      <iframe
        src={`/${item.folder}/review/index.html`}
        title={`${item.frontmatter.title} · review`}
        className="absolute inset-0 size-full border-0"
      />
    </Stage>
  );
  if (props.wide) {
    return (
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_22rem] gap-4">
        {stage}
        <div className="flex min-h-0 min-w-0 flex-col gap-4 overflow-y-auto">
          <ReviewSections item={item} />
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {stage}
      <ReviewSections item={item} />
    </div>
  );
};
