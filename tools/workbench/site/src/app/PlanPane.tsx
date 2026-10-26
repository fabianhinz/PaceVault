import { useState, type FC } from 'react';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { TILE_CLASS } from '@pacevault/ui/lib/surfaces.ts';
import { PvChip } from '@pacevault/ui/components/pvChip/PvChip.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { cn } from '@pacevault/ui/lib/cn.ts';
import type { BoardItem } from '@site/lib/board.ts';
import { CheckRow } from './CheckRow.tsx';
import { EmptyNote } from './EmptyNote.tsx';
import { Inline } from './Inline.tsx';
import { PlanSection } from './PlanSection.tsx';
import { Prose } from './Prose.tsx';
import { QuestionRow } from './QuestionRow.tsx';

interface PlanPaneProps {
  item: BoardItem;
}

export const PlanPane: FC<PlanPaneProps> = (props) => {
  const [answeredShown, setAnsweredShown] = useState(false);
  const item = props.item;
  const open = item.questions.filter((question) => question.open);
  const answered = item.questions.filter((question) => !question.open);
  const ticked = item.checks.filter((check) => check.checked).length;
  let checksCount: string | undefined = undefined;
  if (item.checks.length > 0) checksCount = `${ticked}/${item.checks.length}`;
  return (
    <div className="mx-auto w-full max-w-3xl">
      <div
        className={cn(TILE_CLASS, 'grid grid-cols-[auto_1fr] items-baseline gap-x-3 gap-y-2 p-3')}
      >
        <PvTypography variant="caption">Next</PvTypography>
        <PvTypography as="span">
          <Inline markdown={item.frontmatter.next} />
        </PvTypography>
        <PvTypography variant="caption">Depends on</PvTypography>
        <span className="flex flex-wrap gap-1">
          {item.deps.length === 0 && (
            <PvTypography variant="caption" color="textTertiary">
              none
            </PvTypography>
          )}
          {item.deps.map((dep) => (
            <PvChip key={dep}>{dep}</PvChip>
          ))}
        </span>
      </div>
      <PlanSection title="Real-data checks" count={checksCount}>
        {item.checks.length === 0 && <EmptyNote>None yet.</EmptyNote>}
        <ul className="flex flex-col gap-1">
          {item.checks.map((check) => (
            <CheckRow key={check.raw} folder={item.folder} check={check} kind="check" />
          ))}
        </ul>
      </PlanSection>
      <PlanSection title="Open questions" count={String(open.length)}>
        {open.length === 0 && <EmptyNote>No open questions.</EmptyNote>}
        <ul className="flex flex-col gap-3">
          {open.map((question) => (
            <QuestionRow key={question.id} folder={item.folder} question={question} />
          ))}
        </ul>
        {answered.length > 0 && (
          <div className="mt-2">
            <PvButton
              variant="ghost"
              size="sm"
              aria-expanded={answeredShown}
              onClick={() => setAnsweredShown(!answeredShown)}
            >
              {answered.length} answered
            </PvButton>
            {answeredShown && (
              <ul className="mt-2 flex flex-col gap-3">
                {answered.map((question) => (
                  <QuestionRow key={question.id} folder={item.folder} question={question} />
                ))}
              </ul>
            )}
          </div>
        )}
      </PlanSection>
      <Prose html={item.planHtml} className="mt-6" />
    </div>
  );
};
