import { useEffect, useId, useState } from 'react';
import { m } from '@/paraglide/messages.js';
import { cn } from '@/lib/utils.ts';
import { overlayClass } from '@/components/ui/Card.tsx';
import { Typography } from '@/components/ui/Typography.tsx';
import { useOnboardingStore } from '@/store/onboarding.ts';
import { useOnboardingPreviewRoutes } from '@/features/map/hooks/useOnboardingPreviewRoutes.ts';

const LOGO_CYCLE_MS = 3000;
const FADE_MS = 500;

// The public/logo.svg strokes. Their cyan and blue stay off the map (CLAUDE.md §6).
const STROKES = [
  { d: 'M 35 105 C 15 65, 35 35, 60 25', color: '#22d3ee', animation: 'animate-logo-stroke-0' },
  { d: 'M 60 105 C 60 60, 50 45, 60 25', color: '#4ade80', animation: 'animate-logo-stroke-1' },
  { d: 'M 85 105 C 105 65, 85 35, 60 25', color: '#60a5fa', animation: 'animate-logo-stroke-2' },
];

// At least one full cycle; a slower load finishes the cycle it is in, so the logo is empty at hand-off.
const handoffAt = (readyMs: number): number =>
  Math.ceil(Math.max(readyMs, LOGO_CYCLE_MS) / LOGO_CYCLE_MS) * LOGO_CYCLE_MS;

const AnimatedLogo = () => {
  const idPrefix = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  return (
    <svg viewBox="0 0 120 120" width={96} height={96} aria-hidden>
      <defs>
        {STROKES.map((stroke, i) => (
          <linearGradient key={stroke.d} id={`${idPrefix}-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor={stroke.color} stopOpacity={1} />
            <stop offset="100%" stopColor={stroke.color} stopOpacity={0} />
          </linearGradient>
        ))}
      </defs>
      <rect width={120} height={120} rx={20} fill="#030712" />
      <g fill="none" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round">
        {STROKES.map((stroke, i) => (
          <path
            key={stroke.d}
            d={stroke.d}
            pathLength={1}
            strokeDasharray="1 2"
            strokeDashoffset={1.05}
            stroke={`url(#${idPrefix}-${i})`}
            className={stroke.animation}
          />
        ))}
      </g>
    </svg>
  );
};

/** First-start loader over the basemap; hands off to the preview draw-in at a cycle boundary. */
export const LogoLoader = () => {
  const revealed = useOnboardingStore((s) => s.onboardingPreviewRevealed);
  const settled = useOnboardingPreviewRoutes().status !== 'pending';
  const [mountedAt] = useState(() => performance.now());
  const [faded, setFaded] = useState(false);

  useEffect(() => {
    if (!settled) return;
    const readyMs = performance.now() - mountedAt;
    const timeout = setTimeout(
      () => useOnboardingStore.getState().revealOnboardingPreview(),
      handoffAt(readyMs) - readyMs,
    );
    return () => clearTimeout(timeout);
  }, [settled, mountedAt]);

  useEffect(() => {
    if (!revealed) return;
    const timeout = setTimeout(() => setFaded(true), FADE_MS);
    return () => clearTimeout(timeout);
  }, [revealed]);

  if (revealed && faded) return null;

  return (
    <div
      role="status"
      data-testid="onboarding-loader"
      className={cn(
        'fixed inset-0 z-50 grid place-items-center transition-opacity duration-500',
        overlayClass,
        revealed && 'pointer-events-none opacity-0',
      )}
    >
      <div className="grid place-items-center gap-6">
        <AnimatedLogo />
        <Typography variant="caption" color="textTertiary">
          {m.ui_onboarding_loading()}
        </Typography>
      </div>
    </div>
  );
};
