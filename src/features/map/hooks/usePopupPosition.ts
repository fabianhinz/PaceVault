import { useMemo } from 'react';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop.ts';

const POPUP_WIDTH = 380;
const POPUP_HEIGHT = 300;
const GAP = 8;
const SAFE_ZONE_PADDING = 16;

export interface SafeZone {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface PopupPosition {
  left: number;
  top: number;
  flipX: boolean;
  flipY: boolean;
}

export const computePopupPosition = (x: number, y: number, safeZone: SafeZone): PopupPosition => {
  const safeWidth = safeZone.right - safeZone.left;
  const safeHeight = safeZone.bottom - safeZone.top;

  const popupW = Math.min(POPUP_WIDTH, safeWidth);
  const popupH = Math.min(POPUP_HEIGHT, safeHeight);

  let left = x + GAP;
  let flipX = false;
  if (left + popupW > safeZone.right) {
    left = x - GAP;
    flipX = true;
  }

  let top = y + GAP;
  let flipY = false;
  if (top + popupH > safeZone.bottom) {
    top = y - GAP;
    flipY = true;
  }

  if (flipX) {
    left = Math.max(safeZone.left + popupW, Math.min(left, safeZone.right));
  } else {
    left = Math.max(safeZone.left, Math.min(left, safeZone.right - popupW));
  }
  if (flipY) {
    top = Math.max(safeZone.top + popupH, Math.min(top, safeZone.bottom));
  } else {
    top = Math.max(safeZone.top, Math.min(top, safeZone.bottom - popupH));
  }

  return { left, top, flipX, flipY };
};

export const usePopupPosition = (x: number, y: number): React.CSSProperties => {
  const isDesktop = useIsDesktop();
  return useMemo(() => {
    const dock = document.querySelector<HTMLElement>('[data-layout="dock"]');
    const main = document.querySelector<HTMLElement>('[data-layout="main"]');

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const safeZone: SafeZone = { left: 0, top: 0, right: vw, bottom: vh };

    if (dock) {
      const dockRect = dock.getBoundingClientRect();
      if (isDesktop) {
        safeZone.left = dockRect.right + SAFE_ZONE_PADDING;
      } else {
        safeZone.bottom = dockRect.top - SAFE_ZONE_PADDING;
      }
    }

    if (main && isDesktop) {
      const mainRect = main.getBoundingClientRect();
      safeZone.right = mainRect.left - SAFE_ZONE_PADDING;
    }

    const safeWidth = safeZone.right - safeZone.left;
    const safeHeight = safeZone.bottom - safeZone.top;
    const popupW = Math.min(POPUP_WIDTH, safeWidth);
    const popupH = Math.min(POPUP_HEIGHT, safeHeight);

    const pos = computePopupPosition(x, y, safeZone);

    let finalLeft = pos.left;
    if (pos.flipX) {
      finalLeft = pos.left - popupW;
    }
    let finalTop = pos.top;
    if (pos.flipY) {
      finalTop = pos.top - popupH;
    }

    return {
      position: 'fixed' as const,
      left: finalLeft,
      top: finalTop,
      zIndex: 50,
    };
  }, [x, y, isDesktop]);
};
