import type { FC } from 'react';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { cn } from '@pacevault/ui/lib/cn.ts';
import type { WriteResult } from '@site/actions/index.ts';
import { useUndoMutation } from '@site/app/hooks/useUndoMutation.ts';

type Line = { kind: 'context' | 'del' | 'add'; text: string };

const linesOf = (writeResult: WriteResult): Line[] => {
  const lines: Line[] = [];
  for (const change of writeResult.changes) {
    for (const line of change.diff.split('\n')) {
      if (line.startsWith('@@')) continue;
      let kind: Line['kind'] = 'context';
      if (line.startsWith('-')) kind = 'del';
      else if (line.startsWith('+')) kind = 'add';
      lines.push({ kind, text: line });
    }
  }
  const folder = writeResult.folder;
  if (folder !== undefined) {
    let kind: Line['kind'] = 'add';
    let sign = '+';
    if (folder.state === 'deleted') {
      kind = 'del';
      sign = '-';
    }
    for (const file of folder.files) lines.push({ kind, text: `${sign} ${file}` });
  }
  return lines;
};

const CLASSES_BY_LINE_KIND: Record<Line['kind'], string> = {
  context: 'text-text-tertiary',
  del: 'bg-status-danger-muted text-status-danger',
  add: 'bg-status-success-muted text-status-success',
};

interface WrittenChangesProps {
  writeResult: WriteResult;
}

export const WrittenChanges: FC<WrittenChangesProps> = (props) => {
  const undo = useUndoMutation();
  const writeResult = props.writeResult;
  const lines = linesOf(writeResult);
  return (
    <>
      {lines.length > 0 && (
        <div className="flex max-h-60 flex-col overflow-auto rounded-md border border-white/10 bg-surface-sunken">
          {lines.map((line, index) => (
            <span
              key={index}
              className={cn(
                'px-2 py-0.5 font-mono text-xs break-all whitespace-pre-wrap',
                CLASSES_BY_LINE_KIND[line.kind],
              )}
            >
              {line.text}
            </span>
          ))}
        </div>
      )}
      {writeResult.notes.map((note) => (
        <PvTypography key={note} variant="caption" color="warning" as="p">
          {note}
        </PvTypography>
      ))}
      <div className="flex items-center justify-end gap-2">
        {writeResult.name.startsWith('undo ') && (
          <PvTypography variant="caption" color="textTertiary">
            Undone.
          </PvTypography>
        )}
        {!writeResult.name.startsWith('undo ') && (
          <PvButton
            variant="secondary"
            size="sm"
            loading={undo.isPending}
            onClick={() => undo.mutate(writeResult)}
          >
            Undo
          </PvButton>
        )}
      </div>
    </>
  );
};
