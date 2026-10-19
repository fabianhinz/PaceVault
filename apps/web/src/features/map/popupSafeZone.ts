const SAFE_ZONE_PADDING = 16;

interface SafeZone {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** Viewport area a map popup may cover: clear of the dock and, on desktop, the side panel. */
const popupSafeZone = (isDesktop: boolean): SafeZone => {
  const dock = document.querySelector<HTMLElement>('[data-layout="dock"]');
  const main = document.querySelector<HTMLElement>('[data-layout="main"]');

  const safeZone: SafeZone = {
    left: 0,
    top: 0,
    right: window.innerWidth,
    bottom: window.innerHeight,
  };

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

  return safeZone;
};

/** Safe zone as Radix `collisionPadding` (distance from each viewport edge). */
export const popupCollisionPadding = (isDesktop: boolean) => {
  const safe = popupSafeZone(isDesktop);
  return {
    left: safe.left,
    top: safe.top,
    right: window.innerWidth - safe.right,
    bottom: window.innerHeight - safe.bottom,
  };
};
