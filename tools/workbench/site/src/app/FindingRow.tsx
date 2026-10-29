import type { FC } from 'react';
import { Trash2 } from 'lucide-react';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { PvChip } from '@pacevault/ui/components/pvChip/PvChip.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import type { FindingView } from '@site/lib/board.ts';
import { Inline } from './Inline.tsx';
import { useWriteMutation } from '@site/app/hooks/useWriteMutation.ts';

interface FindingRowProps {
  folder: string;
  finding: FindingView;
}

export const FindingRow: FC<FindingRowProps> = (props) => {
  const remove = useWriteMutation();
  const finding = props.finding;
  let where = 'general';
  if (finding.on !== undefined) where = `on ${finding.on}`;
  return (
    <li className="flex items-start gap-2">
      <PvChip className="mt-0.5 shrink-0">{finding.id}</PvChip>
      <PvTypography as="span" className="min-w-0 flex-1">
        <span className="text-text-tertiary">
          {where} · {finding.state} ·{' '}
        </span>
        <Inline markdown={finding.text} />
      </PvTypography>
      <PvButton
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
      </PvButton>
    </li>
  );
};
