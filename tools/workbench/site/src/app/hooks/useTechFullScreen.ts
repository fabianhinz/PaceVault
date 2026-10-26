import { useCallback, useRef, useState, type RefObject } from 'react';
import { controlOf, graphIn, hideFull, showFull } from '@site/scripts/tech.ts';

interface TechFullScreen {
  full: HTMLElement | undefined;
  open: (frame: HTMLElement) => void;
  body: RefObject<HTMLDivElement | null>;
  bodyRef: (node: HTMLDivElement | null) => void;
  close: () => void;
  control: ReturnType<typeof controlOf>;
  switchTo: (actual: boolean) => Promise<void>;
  diagram: boolean;
  label: string;
  path: string;
}

export const useTechFullScreen = (): TechFullScreen => {
  const body = useRef<HTMLDivElement | null>(null);
  const [full, setFull] = useState<HTMLElement | undefined>(undefined);

  const bodyRef = useCallback(
    (node: HTMLDivElement | null) => {
      body.current = node;
      if (node !== null && full !== undefined) showFull({ body: node, frame: full });
    },
    [full],
  );

  const close = () => {
    if (body.current !== null && full !== undefined) hideFull({ body: body.current, frame: full });
    setFull(undefined);
  };

  let control: ReturnType<typeof controlOf> = undefined;
  if (full !== undefined) control = controlOf(full);
  const switchTo = async (actual: boolean) => {
    if (control === undefined || full === undefined || control.isActual() === actual) return;
    if (body.current !== null) hideFull({ body: body.current, frame: full });
    await control.set(actual);
    setFull(control.frameOf(actual));
  };
  const diagram = full !== undefined && graphIn(full) !== undefined;
  const bar = full?.querySelector(':scope > .tt-fig__bar');
  const label = bar?.querySelector('.tt-fig__label')?.textContent ?? '';
  const path = bar?.querySelector('.tt-fig__path')?.textContent ?? full?.dataset.title ?? '';

  return { full, open: setFull, body, bodyRef, close, control, switchTo, diagram, label, path };
};
