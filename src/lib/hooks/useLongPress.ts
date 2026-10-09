import { useCallback, useEffect, useRef } from 'react';
import type { MouseEvent, PointerEvent } from 'react';

const LONG_PRESS_MS = 500;

export const useLongPress = (onLongPress: () => void) => {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fired = useRef(false);

  const cancel = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  useEffect(() => cancel, [cancel]);

  const onPointerDown = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      fired.current = false;
      cancel();
      if (e.pointerType !== 'touch') {
        return;
      }
      timer.current = setTimeout(() => {
        timer.current = null;
        fired.current = true;
        onLongPress();
      }, LONG_PRESS_MS);
    },
    [cancel, onLongPress],
  );

  const consumeLongPress = useCallback((): boolean => {
    if (!fired.current) {
      return false;
    }
    fired.current = false;
    return true;
  }, []);

  return {
    handlers: {
      onPointerDown,
      onPointerUp: cancel,
      onPointerLeave: cancel,
      onPointerCancel: cancel,
      onContextMenu: (e: MouseEvent<HTMLElement>) => {
        if (fired.current || timer.current !== null) {
          e.preventDefault();
        }
      },
    },
    consumeLongPress,
  };
};
