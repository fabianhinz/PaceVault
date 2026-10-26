import { useState, type FC } from 'react';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { PvDialogBody } from '@pacevault/ui/components/pvDialog/PvDialogBody.tsx';
import { PvDialogFooter } from '@pacevault/ui/components/pvDialog/PvDialogFooter.tsx';
import { PvInput } from '@pacevault/ui/components/pvInput/PvInput.tsx';
import { PvRadioGroup } from '@pacevault/ui/components/pvRadioGroup/PvRadioGroup.tsx';
import { PvRadioGroupItem } from '@pacevault/ui/components/pvRadioGroup/PvRadioGroupItem.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import type { QuestionView } from '@site/lib/board.ts';
import { Inline } from './Inline.tsx';
import { useWriteMutation } from '@site/app/hooks/useWriteMutation.ts';
import { messageOf } from './writeErrors.ts';

const QUICK_ANSWERS = ['you decide', "i don't get it"];

interface AnswerFormProps {
  folder: string;
  question: QuestionView;
  onDone: () => void;
}

/** The form, mounted only while the dialog is open, so every open starts empty. */
export const AnswerForm: FC<AnswerFormProps> = (props) => {
  const [option, setOption] = useState('');
  const [words, setWords] = useState('');
  const answer = useWriteMutation({ inline: true });
  const comment = useWriteMutation({ inline: true });
  const remove = useWriteMutation();
  const question = props.question;
  const error = answer.error ?? comment.error;
  let placeholder = 'Your answer, quoted as Owner: "…"';
  if (question.options.length > 0)
    placeholder = 'Optional: empty quotes the letter, e.g. Owner: "a"';
  const busy = answer.isPending || comment.isPending || remove.isPending;
  return (
    <>
      <PvDialogBody>
        <div className="flex flex-col gap-4 lg:mt-4">
          <PvTypography>
            <Inline markdown={question.question} />
          </PvTypography>
          {question.options.length > 0 && (
            <PvRadioGroup value={option} onValueChange={setOption}>
              {question.options.map((entry) => (
                <PvRadioGroupItem
                  key={entry.id}
                  value={entry.id}
                  aria-label={`(${entry.id}) ${entry.text}`}
                >
                  <PvTypography as="span">
                    <strong className="font-medium">({entry.id})</strong>{' '}
                    <Inline markdown={entry.text} />
                  </PvTypography>
                </PvRadioGroupItem>
              ))}
            </PvRadioGroup>
          )}
          <PvInput
            aria-label="Your words"
            placeholder={placeholder}
            value={words}
            onChange={(event) => setWords(event.target.value)}
            error={error !== null}
            helperText={error !== null ? messageOf(error) : undefined}
          />
          <div className="flex flex-wrap gap-2">
            {QUICK_ANSWERS.map((text) => (
              <PvButton key={text} variant="secondary" size="sm" onClick={() => setWords(text)}>
                {text}
              </PvButton>
            ))}
          </div>
        </div>
      </PvDialogBody>
      <PvDialogFooter className="grid-cols-3">
        <PvButton
          variant="danger"
          title={`Deletes ${question.id} with its comments; Undo in the write card`}
          loading={remove.isPending}
          disabled={busy}
          className="lg:mr-auto"
          onClick={() =>
            remove.mutate(
              {
                name: 'plan.deleteQuestion',
                fields: { item: props.folder, expected: question.raw },
              },
              { onSuccess: props.onDone },
            )
          }
        >
          Delete question
        </PvButton>
        <PvButton
          variant="secondary"
          loading={comment.isPending}
          disabled={busy}
          onClick={() =>
            comment.mutate(
              {
                name: 'plan.commentQuestion',
                fields: { item: props.folder, expected: question.raw, words },
              },
              { onSuccess: props.onDone },
            )
          }
        >
          Comment, keep open
        </PvButton>
        <PvButton
          loading={answer.isPending}
          disabled={busy}
          onClick={() =>
            answer.mutate(
              {
                name: 'plan.answerQuestion',
                fields: { item: props.folder, expected: question.first, option, words },
              },
              { onSuccess: props.onDone },
            )
          }
        >
          Answer
        </PvButton>
      </PvDialogFooter>
    </>
  );
};
