import { useState, type FC } from 'react';
import { useMutationState } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { PvCard } from '@pacevault/ui/components/pvCard/PvCard.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import type { WriteResult } from '@site/actions/index.ts';
import { useWriteCardCloseTimer } from '@site/app/hooks/useWriteCardCloseTimer.ts';
import { messageOf } from './writeErrors.ts';
import { WrittenChanges } from './WrittenChanges.tsx';
import type { WriteMeta } from './types.ts';

const titleOf = (writeResult: WriteResult): string => {
  const folder = writeResult.folder;
  if (folder !== undefined && folder.state === 'deleted') return `Deleted ${folder.folder}/`;
  if (folder !== undefined) return `Restored ${folder.folder}/`;
  return `Wrote ${writeResult.changes.map((change) => change.path).join(', ')}`;
};

export const WriteCard: FC = () => {
  const writes = useMutationState({
    filters: { mutationKey: ['write'] },
    select: (mutation) => {
      const meta = mutation.options.meta as WriteMeta | undefined;
      return { id: mutation.mutationId, state: mutation.state, inline: meta?.inline === true };
    },
  });
  const latest = writes
    .filter((write) => {
      if (write.state.status === 'success') return true;
      return write.state.status === 'error' && !write.inline;
    })
    .at(-1);
  const latestId = latest?.id;
  const [hidden, setHidden] = useState<number | undefined>(undefined);
  const closeTimer = useWriteCardCloseTimer({ latestId, hide: setHidden });

  if (latest === undefined || latest.id === hidden) return null;
  const writeResult = latest.state.data as WriteResult | undefined;
  let title = 'Write refused';
  if (writeResult !== undefined && latest.state.status === 'success') title = titleOf(writeResult);
  return (
    <PvCard
      floating
      role="status"
      onMouseEnter={closeTimer.onMouseEnter}
      onMouseLeave={closeTimer.onMouseLeave}
      className="fixed right-6 bottom-6 z-[45] w-96 max-w-[calc(100vw-1rem)] gap-3"
    >
      <div className="flex items-center gap-2">
        <PvTypography variant="subtitle1" className="min-w-0 flex-1 break-all">
          {title}
        </PvTypography>
        <PvButton
          variant="ghost"
          size="icon"
          aria-label="Close"
          title="Close"
          onClick={() => setHidden(latest.id)}
        >
          <X className="size-4" />
        </PvButton>
      </div>
      {latest.state.status === 'error' && (
        <PvTypography variant="caption" color="error" as="p">
          {messageOf(latest.state.error)}
        </PvTypography>
      )}
      {latest.state.status === 'success' && writeResult !== undefined && (
        <WrittenChanges writeResult={writeResult} />
      )}
    </PvCard>
  );
};
