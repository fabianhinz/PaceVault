import { useEffect, type RefObject } from 'react';
import { refitTech } from '@site/scripts/tech.ts';

export const useTechRefitEffect = ({
  pane,
  expanded,
  active,
}: {
  pane: RefObject<HTMLDivElement | null>;
  expanded: boolean;
  active: boolean;
}): void => {
  useEffect(() => {
    const element = pane.current;
    if (element === null || !active) return undefined;
    const frame = requestAnimationFrame(() => refitTech(element, { force: true }));
    return () => cancelAnimationFrame(frame);
  }, [pane, expanded, active]);
};
