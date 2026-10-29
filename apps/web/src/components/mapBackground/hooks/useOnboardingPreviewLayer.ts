import { useEffect, useMemo, useState } from 'react';
import { PathLayer } from '@deck.gl/layers';
import type { Sport } from '@pacevault/engine/types.ts';
import { useLayoutStore } from '@/store/layout.ts';
import { useOnboardingStore } from '@/store/onboarding.ts';
import { previewDrawInEnd, slicePath } from '@/lib/demo/previewDrawIn.ts';
import type { PreviewPass } from '@/types.ts';
import {
  ADDITIVE_BLEND,
  TRACK_COLOR_BY_SPORT,
  ALPHA_BY_TRACK_INTENSITY,
  trackModifiers,
} from '@/components/mapBackground/trackColors.ts';
import { useOnboardingPreviewRoutes } from '@/queries/onboarding/useOnboardingPreviewRoutes.ts';

interface PreviewSlice {
  sport: Sport;
  path: [number, number][];
}

const NO_PASSES: PreviewPass[] = [];

/** The demo routes drawing in behind onboarding; null before the reveal and after onboarding. */
export const useOnboardingPreviewLayer = (): PathLayer<PreviewSlice> | null => {
  const onboardingComplete = useLayoutStore((s) => s.onboardingComplete);
  const revealed = useOnboardingStore((s) => s.onboardingPreviewRevealed);
  const passes = useOnboardingPreviewRoutes().data?.passes ?? NO_PASSES;
  const [elapsed, setElapsed] = useState(0);
  const active = revealed && !onboardingComplete && passes.length > 0;

  useEffect(() => {
    if (!active) return;
    const end = previewDrawInEnd(passes);
    let frame = 0;
    let startedAt: number | undefined = undefined;
    const tick = (now: number) => {
      if (startedAt === undefined) startedAt = now;
      const next = Math.min(now - startedAt, end);
      setElapsed(next);
      if (next < end) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, passes]);

  return useMemo(() => {
    if (!active) return null;
    return new PathLayer<PreviewSlice>({
      id: 'onboarding-preview',
      data: passes.map((pass) => ({
        sport: pass.sport,
        path: slicePath({ pass, elapsedMs: elapsed }),
      })),
      getPath: (d) => d.path,
      getColor: (d) => [...TRACK_COLOR_BY_SPORT[d.sport], ALPHA_BY_TRACK_INTENSITY.faint],
      getWidth: trackModifiers.width.default,
      widthMinPixels: 1,
      jointRounded: true,
      capRounded: true,
      pickable: false,
      parameters: ADDITIVE_BLEND,
    });
  }, [active, passes, elapsed]);
};
