import { useState, type FC } from 'react';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import type { BoardItem } from '@site/lib/board.ts';
import { CheckRow } from './CheckRow.tsx';
import { EmptyNote } from './EmptyNote.tsx';
import { FindingRow } from './FindingRow.tsx';
import { ReviewSection } from './ReviewSection.tsx';

interface ReviewSectionsProps {
  item: BoardItem;
}

export const ReviewSections: FC<ReviewSectionsProps> = (props) => {
  const [supersededShown, setSupersededShown] = useState(false);
  const item = props.item;
  const base = `tools/workbench/backlog/${item.folder}/review`;
  const current = item.decisions.filter((check) => !check.superseded);
  const superseded = item.decisions.filter((check) => check.superseded);
  const toConfirm = current.filter((check) => !check.checked).length;
  let decisionsChip: string | undefined = undefined;
  if (current.length > 0) decisionsChip = `${toConfirm} to confirm`;
  return (
    <>
      <ReviewSection
        title="Agent decisions"
        chip={decisionsChip}
        note={`${base}/decisions.md · tick to confirm; to overrule one, tell an agent.`}
      >
        {current.length === 0 && <EmptyNote>No agent decisions.</EmptyNote>}
        <ul className="flex flex-col gap-2">
          {current.map((check) => (
            <CheckRow key={check.raw} folder={item.folder} check={check} kind="agent" />
          ))}
        </ul>
        {superseded.length > 0 && (
          <div className="mt-2">
            <PvButton
              variant="ghost"
              size="sm"
              aria-expanded={supersededShown}
              onClick={() => setSupersededShown(!supersededShown)}
            >
              {superseded.length} superseded
            </PvButton>
            {supersededShown && (
              <ul className="mt-2 flex flex-col gap-2">
                {superseded.map((check) => (
                  <CheckRow key={check.raw} folder={item.folder} check={check} kind="agent" />
                ))}
              </ul>
            )}
          </div>
        )}
      </ReviewSection>
      <ReviewSection title="Findings" chip={undefined} note={`${base}/findings.md`}>
        {item.findings.length === 0 && <EmptyNote>No findings yet.</EmptyNote>}
        <ul className="flex flex-col gap-2">
          {item.findings.map((finding) => (
            <FindingRow key={finding.raw} folder={item.folder} finding={finding} />
          ))}
        </ul>
      </ReviewSection>
      <ReviewSection
        title="Accept"
        chip={undefined}
        note="Tick the real-data checks, then press Mark done in the footer to accept the work (status: done). Clean up later in the chat."
      >
        {item.checks.length === 0 && <EmptyNote>No real-data checks.</EmptyNote>}
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
      </ReviewSection>
    </>
  );
};
