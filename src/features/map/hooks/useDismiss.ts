import { useEffect, useRef } from 'react';

interface DismissOptions {
  escapeEnabled?: boolean;
  outsideEnabled?: boolean;
}

export const useDismiss = (onClose: () => void, options?: DismissOptions) => {
  const escapeEnabled = options?.escapeEnabled ?? true;
  const outsideEnabled = options?.outsideEnabled ?? true;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (escapeEnabled) document.addEventListener('keydown', handleKeyDown);
    if (outsideEnabled) document.addEventListener('pointerdown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [onClose, escapeEnabled, outsideEnabled]);

  return ref;
};
