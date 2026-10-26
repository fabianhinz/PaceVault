import { useState, type FC } from 'react';
import { Trash2 } from 'lucide-react';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { PvChip } from '@pacevault/ui/components/pvChip/PvChip.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import type { QuestionView } from '@site/lib/board.ts';
import { AnswerDialog } from './AnswerDialog.tsx';
import { Inline } from './Inline.tsx';
import { useWriteMutation } from '@site/app/hooks/useWriteMutation.ts';

interface QuestionRowProps {
  folder: string;
  question: QuestionView;
}

export const QuestionRow: FC<QuestionRowProps> = (props) => {
  const [answering, setAnswering] = useState(false);
  const remove = useWriteMutation();
  const question = props.question;
  const options = question.options.map((option) => `(${option.id})`).join(' ');
  return (
    <li className="flex flex-col gap-1">
      <div className="flex items-start gap-2">
        <PvChip className="mt-0.5 shrink-0">{question.id}</PvChip>
        <PvTypography variant="caption" color="textTertiary" className="shrink-0 pt-0.5">
          {question.open ? 'open' : `answered ${question.date ?? ''}`}
        </PvTypography>
        <PvTypography as="span" className="min-w-0 flex-1">
          {question.open && <Inline markdown={question.question} />}
          {question.open && options !== '' && (
            <span className="text-text-tertiary"> {options}</span>
          )}
          {!question.open && <Inline markdown={question.body} />}
        </PvTypography>
        {!question.open && (
          <PvButton
            variant="ghost"
            size="icon"
            aria-label={`Delete ${question.id} with its comments`}
            title={`Delete ${question.id} with its comments`}
            loading={remove.isPending}
            className="-mt-1 hover:text-status-danger"
            onClick={() =>
              remove.mutate({
                name: 'plan.deleteQuestion',
                fields: { item: props.folder, expected: question.raw },
              })
            }
          >
            <Trash2 className="size-4" />
          </PvButton>
        )}
      </div>
      {question.comments.length > 0 && (
        <ul className="list-disc pl-14 text-sm text-text-secondary marker:text-text-quaternary">
          {question.comments.map((comment) => (
            <li key={comment}>
              <Inline markdown={comment} />
            </li>
          ))}
        </ul>
      )}
      {question.open && (
        <div className="flex justify-end">
          <PvButton variant="secondary" size="sm" onClick={() => setAnswering(true)}>
            Answer…
          </PvButton>
          <AnswerDialog
            folder={props.folder}
            question={question}
            open={answering}
            onOpenChange={setAnswering}
          />
        </div>
      )}
    </li>
  );
};
