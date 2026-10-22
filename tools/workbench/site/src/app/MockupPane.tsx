import { useEffect, useRef } from 'react';
import type { BoardItem } from '../lib/board.ts';
import { Stage } from './Stage.tsx';

/**
 * The Mockup tab: the mockup page on the stage at the full pane width. `?board=1` tells the
 * mockup shell it runs inside the board, so it hides its own Questions tab (questions are
 * answered in the Plan tab, Q17); its Q badges stay and read their states from the board. When
 * the item's questions change, the shell is told to refetch them (no iframe reload, the mockup
 * keeps its controls).
 */
export const MockupPane = (props: { item: BoardItem }) => {
  const frame = useRef<HTMLIFrameElement>(null);
  const states = props.item.questions
    .map((question) => `${question.id}:${String(question.open)}`)
    .join(',');
  const shown = useRef(states);
  useEffect(() => {
    if (states === shown.current) return;
    shown.current = states;
    frame.current?.contentWindow?.postMessage({ wbQuestions: true }, '*');
  }, [states]);
  return (
    <Stage label="Mockup" path="mockup/index.html" expandable>
      <iframe
        ref={frame}
        src={`/${props.item.folder}/mockup/index.html?board=1`}
        title={`${props.item.data.title} · mockup`}
        className="absolute inset-0 size-full border-0"
      />
    </Stage>
  );
};
