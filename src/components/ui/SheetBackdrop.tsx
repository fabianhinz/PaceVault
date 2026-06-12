import { cn } from '@/lib/utils.ts';

interface SheetBackdropProps {
  className?: string;
  onClose?: () => void;
}

/**
 * Blurred backdrop for non-Radix bottom sheets (mount-animated, unmounts with the sheet).
 * Mirrors DialogOverlay's styling.
 *
 * Closes on `click` (not `pointerdown`) so the backdrop stays mounted for the whole
 * pointer sequence and the event never reaches the map underneath — closing on
 * pointerdown would unmount the backdrop and let the follow-up click re-open a popup.
 */
export const SheetBackdrop = (props: SheetBackdropProps) => {
  return (
    <div
      className={cn('fixed inset-0 z-50 backdrop-blur-xl animate-in fade-in-0', props.className)}
      onClick={(e) => {
        e.stopPropagation();
        props.onClose?.();
      }}
    />
  );
};
