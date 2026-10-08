import { useRef } from 'react';
import { cn } from '@/lib/utils.ts';

interface SheetBackdropProps {
  className?: string;
  onClose?: () => void;
}

export const SheetBackdrop = (props: SheetBackdropProps) => {
  const pressedHere = useRef(false);

  return (
    <div
      className={cn('fixed inset-0 z-50 backdrop-blur-xl animate-in fade-in-0', props.className)}
      onPointerDown={() => {
        pressedHere.current = true;
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (!pressedHere.current) return;
        pressedHere.current = false;
        props.onClose?.();
      }}
    />
  );
};
