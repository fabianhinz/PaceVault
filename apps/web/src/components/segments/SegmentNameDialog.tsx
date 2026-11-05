import { useState, type ComponentProps, type FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { PvInput } from '@pacevault/ui/components/pvInput/PvInput.tsx';
import { PvLabel } from '@pacevault/ui/components/pvLabel/PvLabel.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { PvDialog } from '@pacevault/ui/components/pvDialog/PvDialog.tsx';
import { PvDialogContent } from '@pacevault/ui/components/pvDialog/PvDialogContent.tsx';
import { PvDialogHeader } from '@pacevault/ui/components/pvDialog/PvDialogHeader.tsx';
import { PvDialogBody } from '@pacevault/ui/components/pvDialog/PvDialogBody.tsx';
import { PvDialogFooter } from '@pacevault/ui/components/pvDialog/PvDialogFooter.tsx';
import { usePageRouting } from '@/routing/usePageRouting.ts';
import type { Segment } from '@/store/segments.ts';

const NAME_INPUT_ID = 'segment-name';

interface SegmentNameDialogProps extends Required<
  Pick<ComponentProps<typeof PvDialog>, 'open' | 'onOpenChange'>
> {
  mode: 'create' | 'rename';
  title: string;
  initialName: string;
  facts: string | undefined;
  similarSegment: Segment | undefined;
  onSubmit: (name: string) => void;
}

export const SegmentNameDialog: FC<SegmentNameDialogProps> = (props) => {
  const pageRouting = usePageRouting();
  const [name, setName] = useState(props.initialName);
  const [openedWith, setOpenedWith] = useState(props.open);
  if (props.open !== openedWith) {
    setOpenedWith(props.open);
    if (props.open) setName(props.initialName);
  }
  const trimmed = name.trim();
  const similar = props.mode === 'create' ? props.similarSegment : undefined;

  return (
    <PvDialog open={props.open} onOpenChange={() => props.onOpenChange(false)}>
      <PvDialogContent closeLabel={m.ui_sheet_drag_close()}>
        <PvDialogHeader title={props.title} />
        <form
          className="contents"
          onSubmit={(event) => {
            event.preventDefault();
            if (trimmed === '') return;
            props.onSubmit(trimmed);
          }}
        >
          <PvDialogBody>
            <PvLabel htmlFor={NAME_INPUT_ID}>{m.ui_segment_name_label()}</PvLabel>
            <PvInput
              id={NAME_INPUT_ID}
              autoFocus
              value={name}
              onFocus={(event) => event.target.select()}
              onChange={(event) => setName(event.target.value)}
            />
            {props.facts !== undefined && (
              <PvTypography variant="caption" as="p" color="textSecondary" className="mt-2">
                {props.facts}
              </PvTypography>
            )}
            {similar !== undefined && (
              <div className="mt-4 flex flex-col items-start gap-2" data-testid="similar-segment">
                <PvTypography variant="body1" color="textSecondary">
                  {m.ui_segment_similar_exists({ name: similar.name })}
                </PvTypography>
                <PvButton
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    props.onOpenChange(false);
                    pageRouting.open({ page: 'segmentDetail', params: { segmentId: similar.id } });
                  }}
                >
                  {m.ui_segment_open()}
                </PvButton>
              </div>
            )}
          </PvDialogBody>
          <PvDialogFooter>
            <PvButton variant="secondary" onClick={() => props.onOpenChange(false)}>
              {m.ui_btn_cancel()}
            </PvButton>
            <PvButton type="submit" disabled={trimmed === ''}>
              {m.ui_btn_save()}
            </PvButton>
          </PvDialogFooter>
        </form>
      </PvDialogContent>
    </PvDialog>
  );
};
