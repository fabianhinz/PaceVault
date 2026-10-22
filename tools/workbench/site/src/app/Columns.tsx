import { useState, type DragEvent, type ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { glassClass } from '@pacevault/ui/components/Card.tsx';
import { Chip } from '@pacevault/ui/components/Chip.tsx';
import { Typography } from '@pacevault/ui/components/Typography.tsx';
import { cn } from '@pacevault/ui/lib/cn.ts';
import type { Status } from '../../../scripts/frontmatter.ts';
import type { BoardItem, BoardView } from '../lib/board.ts';
import { LABELS, type Bucket, type Slot } from '../lib/vocabulary.ts';
import { StatusIcon } from './icons.tsx';
import { ItemCard } from './ItemCard.tsx';
import { NeedsYou } from './NeedsYou.tsx';
import { useWrite } from './useWrite.ts';

/**
 * Needs you, then one column per status grouped into phases split by the owner gates:
 * Plan (Idea · Exploring · Planned) · Gate (Ready) · Build (In dev · In review) · Gate (Done).
 * Columns are at least 14rem wide and the board scrolls sideways. A card drags onto the columns
 * in its `moves` (as `plan.setStatus` allows); the others are dimmed while it drags.
 */

const PHASES: { label: string; gate: boolean; columns: Status[] }[] = [
  { label: 'Plan', gate: false, columns: ['idea', 'exploring', 'planned'] },
  { label: 'Gate', gate: true, columns: ['ready'] },
  { label: 'Build', gate: false, columns: ['in-dev', 'in-review'] },
  { label: 'Gate', gate: true, columns: ['done'] },
];

const GATE_TITLE = 'Owner gate: only you set this status';

type ColumnProps = {
  bucket: Bucket;
  phase: string | undefined;
  count: number | undefined;
  gate: boolean;
  dimmed: boolean;
  target: boolean;
  /**
   * The Needs you variant: sticky on the left above the status columns, which scroll blurred
   * underneath it, and as tall as the board (no phase label row above it).
   */
  sticky?: boolean;
  /** Rendered at the right end of the head (the guide button on Needs you). */
  action?: ReactNode;
  onDragOver?: (event: DragEvent<HTMLElement>) => void;
  onDragLeave?: (event: DragEvent<HTMLElement>) => void;
  onDrop?: (event: DragEvent<HTMLElement>) => void;
  children: ReactNode;
};

const Column = (props: ColumnProps) => (
  <section
    aria-label={LABELS[props.bucket]}
    data-col={props.bucket}
    onDragOver={props.onDragOver}
    onDragLeave={props.onDragLeave}
    onDrop={props.onDrop}
    className={cn(
      'flex min-h-0 min-w-56 flex-1 basis-0 flex-col gap-2 transition-opacity',
      props.phase !== undefined && 'ml-2',
      props.sticky === true && 'sticky left-0 z-10',
      props.dimmed && 'opacity-40',
    )}
  >
    {props.sticky !== true && (
      <Typography variant="overline" className="h-4 pl-1">
        {props.phase}
      </Typography>
    )}
    <div
      className={cn(
        glassClass,
        'flex min-h-0 flex-1 flex-col rounded-2xl p-2',
        props.target && 'ring-2 ring-accent',
      )}
    >
      <h2 className="flex shrink-0 items-center gap-2 px-1 pt-1 pb-2">
        <StatusIcon bucket={props.bucket} className="text-text-quaternary" />
        <Typography variant="subtitle2" noWrap zeroMinWidth>
          {LABELS[props.bucket]}
        </Typography>
        {props.count !== undefined && <Chip className="ml-auto">{props.count}</Chip>}
        {props.gate && (
          <span title={GATE_TITLE} aria-label={GATE_TITLE} role="img">
            <Lock className="size-3 text-text-tertiary" aria-hidden="true" />
          </span>
        )}
        {props.action}
      </h2>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto [scrollbar-width:none]">
        {props.children}
      </div>
    </div>
  </section>
);

type ColumnsProps = {
  board: BoardView;
  /** Room to scroll every column out from under the open (not expanded) panel at 1280. */
  spacer: boolean;
  onOpen: (folder: string, tab: Slot | undefined) => void;
  /** The guide button, at the right end of the Needs you head. */
  guide: ReactNode;
};

export const Columns = (props: ColumnsProps) => {
  const [dragged, setDragged] = useState<BoardItem | undefined>(undefined);
  const [over, setOver] = useState<Status | undefined>(undefined);
  const write = useWrite();
  const accepts = (status: Status) => dragged !== undefined && dragged.moves.includes(status);
  const endDrag = () => {
    setDragged(undefined);
    setOver(undefined);
  };
  const dropProps = (status: Status) => ({
    onDragOver: (event: DragEvent<HTMLElement>) => {
      if (!accepts(status)) return;
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
        fields: { item: item.folder, expected: item.lines.status, to: status },
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
          <NeedsYou
            needs={props.board.needs}
            flaky={props.board.flaky}
            onOpen={(folder, tab) => props.onOpen(folder, tab)}
          />
        </Column>
        {PHASES.flatMap((phase) =>
          phase.columns.map((status, index) => {
            const cards = props.board.items.filter((item) => item.data.status === status);
            let label: string | undefined = undefined;
            if (index === 0) label = phase.label;
            return (
              <Column
                key={status}
                bucket={status}
                phase={label}
                count={cards.length}
                gate={phase.gate}
                dimmed={dragged !== undefined && !accepts(status)}
                target={over === status}
                {...dropProps(status)}
              >
                <ul className="flex flex-col gap-2">
                  {cards.map((item) => (
                    <ItemCard
                      key={item.folder}
                      item={item}
                      dragging={dragged?.folder === item.folder}
                      onOpen={() => props.onOpen(item.folder, undefined)}
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
