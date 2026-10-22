import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { RotateCcw } from 'lucide-react';
import { Button } from '@pacevault/ui/components/Button.tsx';
import type { BoardItem } from '../lib/board.ts';
import {
  controlOf,
  graphIn,
  hideFull,
  initTech,
  refitTech,
  resetFull,
  showFull,
} from '../scripts/tech.ts';
import { Stage } from './Stage.tsx';

/**
 * The Tech tab: tech.md as the server rendered it (Shiki), its Mermaid blocks drawn by
 * `scripts/tech.ts`, which changes the DOM under this pane. React hands over the same `techHtml`
 * object between renders (so it leaves the drawn figures alone) and `initTech` runs again only
 * when it or the Actual sides (`actualHtml`) change; the one Planned | Actual switch then starts at
 * Planned again. The diagrams refit when the panel expands or collapses, and when the tab shows.
 */
export const TechPane = (props: { item: BoardItem; expanded: boolean; active: boolean }) => {
  const pane = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement | null>(null);
  const [full, setFull] = useState<HTMLElement | undefined>(undefined);
  const techHtml = props.item.techHtml;
  const actualHtml = props.item.actualHtml ?? '';
  // React 19 sets innerHTML again for every new `__html` object, so these stay the same objects
  // until the HTML itself changes (else every render wipes the drawn figures). A new Actual side
  // or another item mounts the article afresh (its key), so the switch picks it up at Planned.
  const article = useMemo(() => ({ __html: techHtml ?? '' }), [techHtml]);
  const actual = useMemo(() => ({ __html: actualHtml }), [actualHtml]);

  useEffect(() => {
    const element = pane.current;
    if (element === null || techHtml === undefined) return;
    initTech(element, (frame) => setFull(frame));
  }, [techHtml, actualHtml, props.item.folder]);

  useEffect(() => {
    const element = pane.current;
    if (element === null || !props.active) return undefined;
    const frame = requestAnimationFrame(() => refitTech(element, true));
    return () => cancelAnimationFrame(frame);
  }, [props.expanded, props.active]);

  const bodyRef = useCallback(
    (node: HTMLDivElement | null) => {
      body.current = node;
      if (node !== null && full !== undefined) showFull(node, full);
    },
    [full],
  );

  const close = () => {
    if (body.current !== null && full !== undefined) hideFull(body.current, full);
    setFull(undefined);
  };

  // R29: the section's Planned | Actual switch in the full-screen stage swaps the frame in place;
  // R32: any frame opens here (a diagram's svg pans and zooms, a list or code frame scrolls).
  const control = full === undefined ? undefined : controlOf(full);
  const switchTo = async (actual: boolean) => {
    if (control === undefined || full === undefined || control.isActual() === actual) return;
    if (body.current !== null) hideFull(body.current, full);
    await control.set(actual);
    setFull(control.frameOf(actual));
  };
  const diagram = full !== undefined && graphIn(full) !== undefined;
  const bar = full?.querySelector(':scope > .tt-fig__bar');
  const label = bar?.querySelector('.tt-fig__label')?.textContent ?? '';
  const path = bar?.querySelector('.tt-fig__path')?.textContent ?? full?.dataset.title ?? '';

  return (
    <div ref={pane} className="mx-auto w-full max-w-3xl">
      <article
        key={`${props.item.folder}\n${actualHtml}`}
        data-tech={props.item.folder}
        className="wb-md tt-md"
        dangerouslySetInnerHTML={article}
      />
      <template data-actual dangerouslySetInnerHTML={actual} />
      {full !== undefined &&
        createPortal(
          <Stage
            label={label}
            path={path}
            expandable
            full
            onFullChange={close}
            bodyRef={bodyRef}
            bodyClassName={diagram ? 'tt-full__body' : 'tt-full__frame'}
            lead={
              control !== undefined && (
                <div
                  className="tt-seg tt-seg--sm"
                  role="group"
                  aria-label={`${control.name}: planned or actual`}
                >
                  <button
                    type="button"
                    aria-pressed={!control.isActual()}
                    onClick={() => void switchTo(false)}
                  >
                    Planned
                  </button>
                  <button
                    type="button"
                    aria-pressed={control.isActual()}
                    disabled={control.hint !== undefined}
                    title={control.hint}
                    onClick={() => void switchTo(true)}
                  >
                    Actual
                  </button>
                </div>
              )
            }
            actions={
              diagram && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Reset view"
                  title="Reset view (or double-click)"
                  onClick={() => {
                    if (body.current !== null) resetFull(body.current);
                  }}
                >
                  <RotateCcw className="size-4" />
                </Button>
              )
            }
          />,
          document.body,
        )}
    </div>
  );
};
