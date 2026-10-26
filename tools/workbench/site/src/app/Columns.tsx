import { useState, type DragEvent, type ReactNode, type FC } from 'react';
import type { Status } from '@scripts/frontmatter.ts';
import type { BoardItem, BoardView } from '@site/lib/board.ts';
import type { Slot } from '@site/lib/vocabulary.ts';
import { Column } from './Column.tsx';
import { ItemCard } from './ItemCard.tsx';
import { NeedsYou } from './NeedsYou.tsx';
import { useWriteMutation } from '@site/app/hooks/useWriteMutation.ts';

const PHASES: { label: string; gate: boolean; columns: Status[] }[] = [
  { label: 'Plan', gate: false, columns: ['idea', 'exploring', 'planned'] },
  { label: 'Gate', gate: true, columns: ['ready'] },
  { label: 'Build', gate: false, columns: ['in-dev', 'in-review'] },
  { label: 'Gate', gate: true, columns: ['done'] },
];

interface ColumnsProps {
  board: BoardView;
  spacer: boolean;
  onOpen: (target: { folder: string; tab: Slot | undefined }) => void;
  guide: ReactNode;
}

export const Columns: FC<ColumnsProps> = (props) => {
  const [dragged, setDragged] = useState<BoardItem | undefined>(undefined);
  const [over, setOver] = useState<Status | undefined>(undefined);
  const write = useWriteMutation();
  const isMoveTarget = (status: Status) => dragged !== undefined && dragged.moves.includes(status);
  const endDrag = () => {
    setDragged(undefined);
    setOver(undefined);
  };
  const dropProps = (status: Status) => ({
    onDragOver: (event: DragEvent<HTMLElement>) => {
      if (!isMoveTarget(status)) return;
      event.preventDefault();
      setOver(status);
    },
    onDragLeave: (event: DragEvent<HTMLElement>) => {
      const next = event.relatedTarget;
      if (next instanceof Node && event.currentTarget.contains(next)) return;
      setOver((current) => {
        if (current === status) return undefined;
        return current;
      });
    },
    onDrop: (event: DragEvent<HTMLElement>) => {
      const item = dragged;
      endDrag();
      if (item === undefined || !item.moves.includes(status)) return;
      event.preventDefault();
      write.mutate({
        name: 'plan.setStatus',
        fields: { item: item.folder, expected: item.statusLine, to: status },
      });
    },
  });
  return (
    <main
      aria-label="Board"
      className="flex min-h-0 flex-1 overflow-auto overscroll-none p-4 [scrollbar-width:none]"
    >
      {/* 8 columns × 14rem + 7 gaps + 4 phase gaps of 0.5rem */}
      <div className="flex min-w-[117.5rem] flex-[0_0_100%] gap-2">
        <Column
          bucket="needs-you"
          phase={undefined}
          count={undefined}
          gate={false}
          dimmed={dragged !== undefined}
          target={false}
          sticky
          action={props.guide}
        >
          <NeedsYou needs={props.board.needs} flaky={props.board.flaky} onOpen={props.onOpen} />
        </Column>
        {PHASES.flatMap((phase) =>
          phase.columns.map((status, index) => {
            const cards = props.board.items.filter((item) => item.frontmatter.status === status);
            let label: string | undefined = undefined;
            if (index === 0) label = phase.label;
            return (
              <Column
                key={status}
                bucket={status}
                phase={label}
                count={cards.length}
                gate={phase.gate}
                dimmed={dragged !== undefined && !isMoveTarget(status)}
                target={over === status}
                {...dropProps(status)}
              >
                <ul className="flex flex-col gap-2">
                  {cards.map((item) => (
                    <ItemCard
                      key={item.folder}
                      item={item}
                      dragging={dragged?.folder === item.folder}
                      onOpen={() => props.onOpen({ folder: item.folder, tab: undefined })}
                      onDragStart={() => setDragged(item)}
                      onDragEnd={endDrag}
                    />
                  ))}
                </ul>
              </Column>
            );
          }),
        )}
      </div>
      {props.spacer && (
        <div aria-hidden="true" className="hidden shrink-0 basis-[calc(40dvw+1.5rem)] lg:block" />
      )}
    </main>
  );
};
