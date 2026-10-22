import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@pacevault/ui/components/Button.tsx';
import {
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
} from '@pacevault/ui/components/Dialog.tsx';
import { Input } from '@pacevault/ui/components/Input.tsx';
import { RadioGroup, RadioGroupItem } from '@pacevault/ui/components/RadioGroup.tsx';
import { Typography } from '@pacevault/ui/components/Typography.tsx';
import type { QuestionView } from '../lib/board.ts';
import { Inline } from './Prose.tsx';
import { messageOf, useWrite } from './useWrite.ts';

type AnswerProps = {
  folder: string;
  question: QuestionView;
  onDone: () => void;
};

const QUICK = ['you decide', "i don't get it"];

/** The form, mounted only while the dialog is open, so every open starts empty. */
const AnswerForm = (props: AnswerProps) => {
  const [option, setOption] = useState('');
  const [words, setWords] = useState('');
  const answer = useWrite({ inline: true });
  const comment = useWrite({ inline: true });
  const remove = useWrite();
  const q = props.question;
  const error = answer.error ?? comment.error;
  let placeholder = 'Your answer, quoted as Owner: "…"';
  if (q.options.length > 0) placeholder = 'Optional: empty quotes the letter, e.g. Owner: "a"';
  const busy = answer.isPending || comment.isPending || remove.isPending;
  return (
    <>
      <DialogBody>
        <div className="flex flex-col gap-4 lg:mt-4">
          <Typography>
            <Inline markdown={q.question} />
          </Typography>
          {q.options.length > 0 && (
            <RadioGroup value={option} onValueChange={setOption}>
              {q.options.map((entry) => (
                <RadioGroupItem key={entry.id} value={entry.id}>
                  <Typography as="span">
                    <strong className="font-medium">({entry.id})</strong>{' '}
                    <Inline markdown={entry.text} />
                  </Typography>
                </RadioGroupItem>
              ))}
            </RadioGroup>
          )}
          <Input
            aria-label="Your words"
            placeholder={placeholder}
            value={words}
            onChange={(event) => setWords(event.target.value)}
            error={error !== null}
            helperText={error !== null ? messageOf(error) : undefined}
          />
          <div className="flex flex-wrap gap-2">
            {QUICK.map((text) => (
              <Button key={text} variant="secondary" size="sm" onClick={() => setWords(text)}>
                {text}
              </Button>
            ))}
          </div>
        </div>
      </DialogBody>
      <DialogFooter className="grid-cols-3">
        <Button
          variant="danger"
          title={`Deletes ${q.id} with its comments; Undo in the write card`}
          loading={remove.isPending}
          disabled={busy}
          className="lg:mr-auto"
          onClick={() =>
            remove.mutate(
              { name: 'plan.deleteQuestion', fields: { item: props.folder, expected: q.raw } },
              { onSuccess: props.onDone },
            )
          }
        >
          Delete question
        </Button>
        <Button
          variant="secondary"
          loading={comment.isPending}
          disabled={busy}
          onClick={() =>
            comment.mutate(
              {
                name: 'plan.commentQuestion',
                fields: { item: props.folder, expected: q.raw, words },
              },
              { onSuccess: props.onDone },
            )
          }
        >
          Comment, keep open
        </Button>
        <Button
          loading={answer.isPending}
          disabled={busy}
          onClick={() =>
            answer.mutate(
              {
                name: 'plan.answerQuestion',
                fields: { item: props.folder, expected: q.first, option, words },
              },
              { onSuccess: props.onDone },
            )
          }
        >
          Answer
        </Button>
      </DialogFooter>
    </>
  );
};

/**
 * Answers one open question: pick an option and add your words, or "Comment, keep open". Empty
 * words quote the option letter. Close sits top right in the header (`DialogHeader` actions);
 * the footer has Delete question left and the answer actions right, like the panel.
 */
export const AnswerDialog = (props: {
  folder: string;
  question: QuestionView;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const close = () => props.onOpenChange(false);
  return (
    <DialogRoot open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader
          title={`Answer ${props.question.id}`}
          subtitle={`tools/workbench/backlog/${props.folder}/plan.md`}
          actions={
            <Button variant="ghost" size="icon" aria-label="Close" title="Close" onClick={close}>
              <X className="size-4" />
            </Button>
          }
        />
        <AnswerForm folder={props.folder} question={props.question} onDone={close} />
      </DialogContent>
    </DialogRoot>
  );
};
