import { useRef, useState, type RefObject } from 'react';

export interface ListExpansion {
  expanded: boolean;
  toggle: () => void;
  toggleRef: RefObject<HTMLButtonElement | null>;
}

export const useListExpansion = (): ListExpansion => {
  const [expanded, setExpanded] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  return {
    expanded,
    toggleRef,
    toggle: () => {
      if (!expanded) {
        setExpanded(true);
        return;
      }
      setExpanded(false);
      requestAnimationFrame(() => toggleRef.current?.scrollIntoView({ block: 'nearest' }));
    },
  };
};
