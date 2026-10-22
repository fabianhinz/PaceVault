import { useState, type ReactNode } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@pacevault/ui/components/Button.tsx';
import { tileClass } from '@pacevault/ui/components/Card.tsx';
import { Chip } from '@pacevault/ui/components/Chip.tsx';
import { Typography } from '@pacevault/ui/components/Typography.tsx';
import { cn } from '@pacevault/ui/lib/cn.ts';
import type { BoardItem, FindingView } from '../lib/board.ts';
import { CheckRow } from './CheckRow.tsx';
import { Inline } from './Prose.tsx';
import { Stage } from './Stage.tsx';
import { useWrite } from './useWrite.ts';

const Section = (props: {
  title: string;
  chip: string | undefined;
  note: ReactNode;
  children: ReactNode;
}) => (
  <section aria-label={props.title} className={cn(tileClass, 'flex flex-col gap-2 p-4')}>
    <div className="flex items-center gap-2">
      <Typography variant="title" as="h3">
        {props.title}
      </Typography>
      {props.chip !== undefined && <Chip>{props.chip}</Chip>}
    </div>
    <Typography variant="caption" color="textTertiary" as="p">
      {props.note}
    </Typography>
    {props.children}
  </section>
);

const Empty = (props: { children: ReactNode }) => (
  <Typography variant="caption" color="textTertiary" as="p">
    {props.children}
  </Typography>
);

const FindingRow = (props: { folder: string; finding: FindingView }) => {
  const remove = useWrite();
  const finding = props.finding;
  let where = 'general';
  if (finding.on !== undefined) where = `on ${finding.on}`;
  return (
    <li className="flex items-start gap-2">
      <Chip className="mt-0.5 shrink-0">{finding.id}</Chip>
      <Typography as="span" className="min-w-0 flex-1">
        <span className="text-text-tertiary">
          {where} · {finding.state} ·{' '}
        </span>
        <Inline markdown={finding.text} />
      </Typography>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Delete ${finding.id}`}
        title={`Delete ${finding.id}`}
        loading={remove.isPending}
        className="-mt-1 hover:text-status-danger"
        onClick={() =>
          remove.mutate({
            name: 'review.deleteFinding',
            fields: { item: props.folder, expected: finding.raw, heading: finding.heading },
          })
        }
      >
        <Trash2 className="size-4" />
      </Button>
    </li>
  );
};

/**
 * Agent decisions (tick to confirm; superseded ones behind "N superseded", R17), findings and
 * Accept: next to the review doc or alone.
 */
const Sections = (props: { item: BoardItem }) => {
  const [showSuperseded, setShowSuperseded] = useState(false);
  const item = props.item;
  const base = `tools/workbench/backlog/${item.folder}/review`;
  const current = item.decisions.filter((check) => !check.superseded);
  const superseded = item.decisions.filter((check) => check.superseded);
  const toConfirm = current.filter((check) => !check.checked).length;
  let decisionsChip: string | undefined = undefined;
  if (current.length > 0) decisionsChip = `${toConfirm} to confirm`;
  return (
    <>
      <Section
        title="Agent decisions"
        chip={decisionsChip}
        note={`${base}/decisions.md · tick to confirm; to overrule one, tell an agent.`}
      >
        {current.length === 0 && <Empty>No agent decisions.</Empty>}
        <ul className="flex flex-col gap-2">
          {current.map((check) => (
            <CheckRow key={check.raw} folder={item.folder} check={check} kind="agent" />
          ))}
        </ul>
        {superseded.length > 0 && (
          <div className="mt-2">
            <Button
              variant="ghost"
              size="sm"
              aria-expanded={showSuperseded}
              onClick={() => setShowSuperseded(!showSuperseded)}
            >
              {superseded.length} superseded
            </Button>
            {showSuperseded && (
              <ul className="mt-2 flex flex-col gap-2">
                {superseded.map((check) => (
                  <CheckRow key={check.raw} folder={item.folder} check={check} kind="agent" />
                ))}
              </ul>
            )}
          </div>
        )}
      </Section>
      <Section title="Findings" chip={undefined} note={`${base}/findings.md`}>
        {item.findings.length === 0 && <Empty>No findings yet.</Empty>}
        <ul className="flex flex-col gap-2">
          {item.findings.map((finding) => (
            <FindingRow key={finding.raw} folder={item.folder} finding={finding} />
          ))}
        </ul>
      </Section>
      <Section
        title="Accept"
        chip={undefined}
        note="Tick the real-data checks, then press Mark done in the footer to accept the work (status: done). Clean up later in the chat."
      >
        {item.checks.length === 0 && <Empty>No real-data checks.</Empty>}
        <ul className="flex flex-col gap-2">
          {item.checks.map((check) => (
            <CheckRow
              key={check.raw}
              folder={item.folder}
              check={check}
              kind="check"
              removable={false}
            />
          ))}
        </ul>
      </Section>
    </>
  );
};

/**
 * The Review tab. With `review/index.html`: the doc on the stage and the sections beside it
 * (`wide`: the expanded panel at 1280) or below it, in one scroll. Without a doc: the sections as
 * one readable column, like the Plan tab (Q18).
 */
export const ReviewPane = (props: { item: BoardItem; wide: boolean }) => {
  const item = props.item;
  if (!item.reviewDoc) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <Sections item={item} />
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
        title={`${item.data.title} · review`}
        className="absolute inset-0 size-full border-0"
      />
    </Stage>
  );
  if (props.wide) {
    return (
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_22rem] gap-4">
        {stage}
        <div className="flex min-h-0 min-w-0 flex-col gap-4 overflow-y-auto">
          <Sections item={item} />
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {stage}
      <Sections item={item} />
    </div>
  );
};
