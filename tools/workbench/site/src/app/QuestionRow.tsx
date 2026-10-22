import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@pacevault/ui/components/Button.tsx';
import { Chip } from '@pacevault/ui/components/Chip.tsx';
import { Typography } from '@pacevault/ui/components/Typography.tsx';
import type { QuestionView } from '../lib/board.ts';
import { AnswerDialog } from './AnswerDialog.tsx';
import { Inline } from './Prose.tsx';
import { useWrite } from './useWrite.ts';

/**
 * An open question with "Answer…" (its answer dialog, which also deletes it), or an answered one
 * with a delete button.
 */
export const QuestionRow = (props: { folder: string; question: QuestionView }) => {
  const [answering, setAnswering] = useState(false);
  const remove = useWrite();
  const q = props.question;
  const options = q.options.map((option) => `(${option.id})`).join(' ');
  return (
    <li className="flex flex-col gap-1">
      <div className="flex items-start gap-2">
        <Chip className="mt-0.5 shrink-0">{q.id}</Chip>
        <Typography variant="caption" color="textTertiary" className="shrink-0 pt-0.5">
          {q.open ? 'open' : `answered ${q.date ?? ''}`}
        </Typography>
        <Typography as="span" className="min-w-0 flex-1">
          {q.open && <Inline markdown={q.question} />}
          {q.open && options !== '' && <span className="text-text-tertiary"> {options}</span>}
          {!q.open && <Inline markdown={q.body} />}
        </Typography>
        {!q.open && (
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Delete ${q.id} with its comments`}
            title={`Delete ${q.id} with its comments`}
            loading={remove.isPending}
            className="-mt-1 hover:text-status-danger"
            onClick={() =>
              remove.mutate({
                name: 'plan.deleteQuestion',
                fields: { item: props.folder, expected: q.raw },
              })
            }
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>
      {q.comments.length > 0 && (
        <ul className="list-disc pl-14 text-sm text-text-secondary marker:text-text-quaternary">
          {q.comments.map((comment) => (
            <li key={comment}>
              <Inline markdown={comment} />
            </li>
          ))}
        </ul>
      )}
      {q.open && (
        <div className="flex justify-end">
          <Button variant="secondary" size="sm" onClick={() => setAnswering(true)}>
            Answer…
          </Button>
          <AnswerDialog
            folder={props.folder}
            question={q}
            open={answering}
            onOpenChange={setAnswering}
          />
        </div>
      )}
    </li>
  );
};
