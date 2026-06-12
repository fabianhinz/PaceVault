import { useEffect, useRef } from 'react';

export const useDismiss = (onClose: () => void, escapeEnabled = true, outsideEnabled = true) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && escapeEnabled) onClose();
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (!outsideEnabled) return;
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [onClose, escapeEnabled, outsideEnabled]);

  return ref;
};
