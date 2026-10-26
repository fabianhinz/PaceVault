import type { ReactNode, FC } from 'react';
import { createPortal } from 'react-dom';
import { PvList } from '../pvList/PvList.tsx';
import { PvListItem } from '../pvList/PvListItem.tsx';
import { useUnstableSheetPeekContext } from './PvBottomSheetProvider.tsx';
import { useSheetPeekActiveEffect } from '../../hooks/useSheetPeekActiveEffect.ts';

interface PvSheetPeekProps {
  icon: ReactNode;
  primary: string;
  secondary?: string;
}

export const PvSheetPeek: FC<PvSheetPeekProps> = (props) => {
  const peek = useUnstableSheetPeekContext();
  const setActive = peek?.setActive;

  useSheetPeekActiveEffect(setActive);

  if (peek === undefined) {
    console.warn('PvSheetPeek rendered outside PvBottomSheetProvider; nothing is shown.');
    return null;
  }
  if (!peek.target) {
    return null;
  }
  return createPortal(
    <PvList className="w-full">
      <PvListItem
        icon={props.icon}
        primary={<span className="block truncate">{props.primary}</span>}
        secondary={props.secondary && <span className="block truncate">{props.secondary}</span>}
      />
    </PvList>,
    peek.target,
  );
};
