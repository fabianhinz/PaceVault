import { useEffect, useRef } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import { useLayoutStore } from '@/store/layout.ts';
import { useOnboardingStore } from '@/store/onboarding.ts';
import { DESKTOP_MEDIA_QUERY } from '@/lib/hooks/useDevice.ts';
import { readSafeAreaInset } from '@/lib/sheetPosition.ts';
import { fitPadding, PHONE_FIT_MARGIN, type MapPadding } from '../fitPadding.ts';
import { MAP_FIT_MARGIN } from '../mapPadding.ts';
import { useOnboardingPreviewRoutes } from './useOnboardingPreviewRoutes.ts';

const PHONE_REFIT_MS = 900;

const coveredBottom = (element: HTMLElement | null): number => {
  if (element === null) return 0;
  const bottom = Number.parseFloat(getComputedStyle(element).bottom);
  if (Number.isNaN(bottom)) return element.offsetHeight;
  return element.offsetHeight + bottom;
};

const previewPadding = (cardOpen: boolean): MapPadding => {
  const insets: MapPadding = { top: readSafeAreaInset('top'), bottom: 0, left: 0, right: 0 };
  const card = document.querySelector<HTMLElement>('[data-layout="onboarding-card"]');
  if (window.matchMedia(DESKTOP_MEDIA_QUERY).matches) {
    if (card) insets.left = card.getBoundingClientRect().right;
    return fitPadding({ canvasHeight: window.innerHeight, insets, margin: MAP_FIT_MARGIN });
  }
  if (cardOpen) {
    insets.bottom = coveredBottom(card);
  } else {
    insets.bottom = coveredBottom(
      document.querySelector<HTMLElement>('[data-layout="onboarding-pill"]'),
    );
  }
  return fitPadding({ canvasHeight: window.innerHeight, insets, margin: PHONE_FIT_MARGIN });
};

/**
 * Frames the onboarding preview clear of the card (desktop) or the dialog / pill (phone).
 * Bypasses the regular camera state machine, so the first fit to the user's own tracks still runs.
 * It does not wait for the map's `load` event (that waits for tiles): the camera works before it,
 * and fitting first means the tiles for the preview area are the ones that load.
 */
export const useOnboardingPreviewCameraEffect = () => {
  const map = useMap().current;
  const onboardingComplete = useLayoutStore((s) => s.onboardingComplete);
  const revealed = useOnboardingStore((s) => s.onboardingPreviewRevealed);
  const cardOpen = useOnboardingStore((s) => s.onboardingCardOpen);
  const bounds = useOnboardingPreviewRoutes().data?.bounds ?? null;
  const fittedRef = useRef(false);

  useEffect(() => {
    if (onboardingComplete || !revealed || !map || bounds === null) return;
    let duration = 0;
    if (fittedRef.current) duration = PHONE_REFIT_MS;
    // One frame later the card (or the pill) of this commit is laid out and measurable.
    const frame = requestAnimationFrame(() => {
      fittedRef.current = true;
      map.fitBounds(
        [
          [bounds.minLng, bounds.minLat],
          [bounds.maxLng, bounds.maxLat],
        ],
        { padding: previewPadding(cardOpen), duration },
      );
    });
    return () => cancelAnimationFrame(frame);
  }, [map, onboardingComplete, revealed, bounds, cardOpen]);
};
