import { useRef, type RefObject } from 'react';
import { useEvent } from 'react-use';

interface DismissOptions {
  escapeEnabled?: boolean;
  outsideEnabled?: boolean;
}

export const useDismiss = (
  onClose: () => void,
  options?: DismissOptions,
): RefObject<HTMLDivElement | null> => {
  const escapeEnabled = options?.escapeEnabled ?? true;
  const outsideEnabled = options?.outsideEnabled ?? true;
  const ref = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: Event) => {
    if (e instanceof KeyboardEvent && e.key === 'Escape') onClose();
  };
  const handleClickOutside = (e: Event) => {
    if (!ref.current || !(e.target instanceof Element)) {
      return;
    }
    if (ref.current.contains(e.target)) {
      return;
    }
    if (e.target.closest('[data-radix-popper-content-wrapper]')) {
      return;
    }
    onClose();
  };
  let keyTarget: Document | null = null;
  if (escapeEnabled) keyTarget = document;
  let pointerTarget: Document | null = null;
  if (outsideEnabled) pointerTarget = document;
  useEvent('keydown', handleKeyDown, keyTarget);
  useEvent('pointerdown', handleClickOutside, pointerTarget);

  return ref;
};
