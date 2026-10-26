import type { ComponentProps, FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { X } from 'lucide-react';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { PvDialogContent } from '@pacevault/ui/components/pvDialog/PvDialogContent.tsx';
import { PvDialogHeader } from '@pacevault/ui/components/pvDialog/PvDialogHeader.tsx';
import { PvDialog } from '@pacevault/ui/components/pvDialog/PvDialog.tsx';
import type { QuestionView } from '@site/lib/board.ts';
import { AnswerForm } from './AnswerForm.tsx';

interface AnswerDialogProps extends Required<
  Pick<ComponentProps<typeof PvDialog>, 'open' | 'onOpenChange'>
> {
  folder: string;
  question: QuestionView;
}

export const AnswerDialog: FC<AnswerDialogProps> = (props) => {
  const close = () => props.onOpenChange(false);
  return (
    <PvDialog open={props.open} onOpenChange={props.onOpenChange}>
      <PvDialogContent closeLabel={m.ui_sheet_drag_close()} aria-describedby={undefined}>
        <PvDialogHeader
          title={`Answer ${props.question.id}`}
          subtitle={`tools/workbench/backlog/${props.folder}/plan.md`}
          actions={
            <PvButton variant="ghost" size="icon" aria-label="Close" title="Close" onClick={close}>
              <X className="size-4" />
            </PvButton>
          }
        />
        <AnswerForm folder={props.folder} question={props.question} onDone={close} />
      </PvDialogContent>
    </PvDialog>
  );
};
