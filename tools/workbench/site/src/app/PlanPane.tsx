import { useState, type ReactNode } from 'react';
import { Button } from '@pacevault/ui/components/Button.tsx';
import { tileClass } from '@pacevault/ui/components/Card.tsx';
import { Chip } from '@pacevault/ui/components/Chip.tsx';
import { Typography } from '@pacevault/ui/components/Typography.tsx';
import { cn } from '@pacevault/ui/lib/cn.ts';
import type { BoardItem } from '../lib/board.ts';
import { CheckRow } from './CheckRow.tsx';
import { Inline, Prose } from './Prose.tsx';
import { QuestionRow } from './QuestionRow.tsx';

const Section = (props: { title: string; count: string | undefined; children: ReactNode }) => (
  <section aria-label={props.title} className="mt-6">
    <div className="mb-2 flex items-center gap-2">
      <Typography variant="title" as="h3">
        {props.title}
      </Typography>
      {props.count !== undefined && <Chip>{props.count}</Chip>}
    </div>
    {props.children}
  </section>
);

const Empty = (props: { children: ReactNode }) => (
  <Typography variant="caption" color="textTertiary" as="p">
    {props.children}
  </Typography>
);

/** The Plan tab: Next and Depends on, the real-data checks, the open questions, then the plan. */
export const PlanPane = (props: { item: BoardItem }) => {
  const [showAnswered, setShowAnswered] = useState(false);
  const item = props.item;
  const open = item.questions.filter((question) => question.open);
  const answered = item.questions.filter((question) => !question.open);
  const ticked = item.checks.filter((check) => check.checked).length;
  let checksCount: string | undefined = undefined;
  if (item.checks.length > 0) checksCount = `${ticked}/${item.checks.length}`;
  return (
    <div className="mx-auto w-full max-w-3xl">
      <div
        className={cn(tileClass, 'grid grid-cols-[auto_1fr] items-baseline gap-x-3 gap-y-2 p-3')}
      >
        <Typography variant="caption">Next</Typography>
        <Typography as="span">
          <Inline markdown={item.data.next} />
        </Typography>
        <Typography variant="caption">Depends on</Typography>
        <span className="flex flex-wrap gap-1">
          {item.deps.length === 0 && (
            <Typography variant="caption" color="textTertiary">
              none
            </Typography>
          )}
          {item.deps.map((dep) => (
            <Chip key={dep}>{dep}</Chip>
          ))}
        </span>
      </div>
      <Section title="Real-data checks" count={checksCount}>
        {item.checks.length === 0 && <Empty>None yet.</Empty>}
        <ul className="flex flex-col gap-1">
          {item.checks.map((check) => (
            <CheckRow key={check.raw} folder={item.folder} check={check} kind="check" />
          ))}
        </ul>
      </Section>
      <Section title="Open questions" count={String(open.length)}>
        {open.length === 0 && <Empty>No open questions.</Empty>}
        <ul className="flex flex-col gap-3">
          {open.map((question) => (
            <QuestionRow key={question.id} folder={item.folder} question={question} />
          ))}
        </ul>
        {answered.length > 0 && (
          <div className="mt-2">
            <Button
              variant="ghost"
              size="sm"
              aria-expanded={showAnswered}
              onClick={() => setShowAnswered(!showAnswered)}
            >
              {answered.length} answered
            </Button>
            {showAnswered && (
              <ul className="mt-2 flex flex-col gap-3">
                {answered.map((question) => (
                  <QuestionRow key={question.id} folder={item.folder} question={question} />
                ))}
              </ul>
            )}
          </div>
        )}
      </Section>
      <Prose html={item.planHtml} className="mt-6" />
    </div>
  );
};
