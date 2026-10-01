import { useContext, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { List, ListItem } from './List.tsx';
import { SheetPeekContext } from './sheetPeekContext.ts';

interface SheetPeekProps {
  icon: ReactNode;
  primary: string;
  secondary?: string;
}

export const SheetPeek = (props: SheetPeekProps) => {
  const peek = useContext(SheetPeekContext);
  const setActive = peek.setActive;

  useEffect(() => {
    setActive(true);
    return () => setActive(false);
  }, [setActive]);

  if (!peek.target) {
    return null;
  }
  return createPortal(
    <List className="w-full">
      <ListItem
        icon={props.icon}
        primary={<span className="block truncate">{props.primary}</span>}
        secondary={props.secondary && <span className="block truncate">{props.secondary}</span>}
      />
    </List>,
    peek.target,
  );
};
