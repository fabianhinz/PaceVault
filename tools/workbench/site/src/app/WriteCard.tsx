import { useEffect, useRef, useState } from 'react';
import { useMutationState } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { Button } from '@pacevault/ui/components/Button.tsx';
import { Card } from '@pacevault/ui/components/Card.tsx';
import { Typography } from '@pacevault/ui/components/Typography.tsx';
import { cn } from '@pacevault/ui/lib/cn.ts';
import type { WriteResult } from '../actions/index.ts';
import { messageOf, useUndo, type WriteMeta } from './useWrite.ts';

/** Closes after 12 s; while hovered it stays (checked again every 2 s). */
const SHOW_MS = 12000;
const HOLD_MS = 2000;

type Line = { kind: 'context' | 'del' | 'add'; text: string };

const linesOf = (result: WriteResult): Line[] => {
  const lines: Line[] = [];
  for (const change of result.changes) {
    for (const line of change.diff.split('\n')) {
      if (line.startsWith('@@')) continue;
      let kind: Line['kind'] = 'context';
      if (line.startsWith('-')) kind = 'del';
      else if (line.startsWith('+')) kind = 'add';
      lines.push({ kind, text: line });
    }
  }
  const folder = result.folder;
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

const titleOf = (result: WriteResult): string => {
  const folder = result.folder;
  if (folder !== undefined && folder.state === 'deleted') return `Deleted ${folder.folder}/`;
  if (folder !== undefined) return `Restored ${folder.folder}/`;
  return `Wrote ${result.changes.map((change) => change.path).join(', ')}`;
};

const LINE_CLASS: Record<Line['kind'], string> = {
  context: 'text-text-tertiary',
  del: 'bg-status-danger-muted text-status-danger',
  add: 'bg-status-success-muted text-status-success',
};

const Written = (props: { result: WriteResult }) => {
  const undo = useUndo();
  const result = props.result;
  const lines = linesOf(result);
  return (
    <>
      {lines.length > 0 && (
        <div className="flex max-h-60 flex-col overflow-auto rounded-md border border-white/10 bg-surface-sunken">
          {lines.map((line, index) => (
            <span
              key={index}
              className={cn(
                'px-2 py-0.5 font-mono text-xs break-all whitespace-pre-wrap',
                LINE_CLASS[line.kind],
              )}
            >
              {line.text}
            </span>
          ))}
        </div>
      )}
      {result.notes.map((note) => (
        <Typography key={note} variant="caption" color="warning" as="p">
          {note}
        </Typography>
      ))}
      <div className="flex items-center justify-end gap-2">
        {result.name.startsWith('undo ') && (
          <Typography variant="caption" color="textTertiary">
            Undone.
          </Typography>
        )}
        {!result.name.startsWith('undo ') && (
          <Button
            variant="secondary"
            size="sm"
            loading={undo.isPending}
            onClick={() => undo.mutate(result)}
          >
            Undo
          </Button>
        )}
      </div>
    </>
  );
};

/**
 * What the last write changed: the file, the diff, notes and Undo; a refused write shows its
 * reason here without Undo. Bottom right at every width, over the panel footer while it shows.
 */
export const WriteCard = () => {
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
  const hovering = useRef(false);

  useEffect(() => {
    if (latestId === undefined) return undefined;
    let timer = 0;
    const arm = (ms: number) => {
      timer = window.setTimeout(() => {
        if (hovering.current) arm(HOLD_MS);
        else setHidden(latestId);
      }, ms);
    };
    arm(SHOW_MS);
    return () => window.clearTimeout(timer);
  }, [latestId]);

  if (latest === undefined || latest.id === hidden) return null;
  const result = latest.state.data as WriteResult | undefined;
  let title = 'Write refused';
  if (result !== undefined && latest.state.status === 'success') title = titleOf(result);
  return (
    <Card
      floating
      role="status"
      onMouseEnter={() => {
        hovering.current = true;
      }}
      onMouseLeave={() => {
        hovering.current = false;
      }}
      className="fixed right-6 bottom-6 z-[45] w-96 max-w-[calc(100vw-1rem)] gap-3"
    >
      <div className="flex items-center gap-2">
        <Typography variant="subtitle1" className="min-w-0 flex-1 break-all">
          {title}
        </Typography>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Close"
          title="Close"
          onClick={() => setHidden(latest.id)}
        >
          <X className="size-4" />
        </Button>
      </div>
      {latest.state.status === 'error' && (
        <Typography variant="caption" color="error" as="p">
          {messageOf(latest.state.error)}
        </Typography>
      )}
      {latest.state.status === 'success' && result !== undefined && <Written result={result} />}
    </Card>
  );
};
