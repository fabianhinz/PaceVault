import type { FC } from 'react';
import { ChevronDown, Triangle, type LucideIcon } from 'lucide-react';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { cn } from '@pacevault/ui/lib/cn.ts';
import type { DotChipLook, DotChipPosition, DotChipTone } from './types.ts';

const PLOT_TOP_PX = 6;
const PLOT_SPAN_PX = 24;
const MARKER_CLASS = 'absolute left-1/2 -translate-x-1/2 -translate-y-1/2';

type OutlierMark = 'chevron' | 'triangle' | 'edge';
type ReferenceLine = 'dashed' | 'dotted' | 'solid' | 'none';

interface LookSpec {
  shape: string;
  idle: string;
  pressed: string;
  bestIdle: string;
  bestPressed: string;
  labelBelow: boolean;
  pressedLabel: string;
  pressedDot: string;
  reference: ReferenceLine;
  outlier: OutlierMark;
  bar: boolean;
}

const SPEC_BY_DOT_CHIP_LOOK: Record<DotChipLook, LookSpec> = {
  current: {
    shape: 'w-14 rounded-lg border border-transparent',
    idle: 'hover:bg-white/5',
    pressed: 'bg-white/10 border-text-primary',
    bestIdle: 'border-best/60',
    bestPressed: 'bg-white/10 border-best/60',
    labelBelow: false,
    pressedLabel: 'text-text-primary',
    pressedDot: '',
    reference: 'dashed',
    outlier: 'chevron',
    bar: false,
  },
  tile: {
    shape: 'w-14 rounded-lg',
    idle: 'hover:bg-white/5',
    pressed: 'bg-white/15',
    bestIdle: '',
    bestPressed: 'bg-best/10',
    labelBelow: false,
    pressedLabel: 'text-text-primary',
    pressedDot: '',
    reference: 'dotted',
    outlier: 'triangle',
    bar: false,
  },
  underline: {
    shape: 'w-14 rounded-none',
    idle: 'hover:bg-white/5',
    pressed: '',
    bestIdle: '',
    bestPressed: '',
    labelBelow: false,
    pressedLabel: 'text-text-primary font-semibold',
    pressedDot: '',
    reference: 'solid',
    outlier: 'chevron',
    bar: true,
  },
  pill: {
    shape: 'w-14 rounded-full',
    idle: 'hover:bg-white/5',
    pressed: 'bg-white/10 ring-1 ring-inset ring-white/30',
    bestIdle: 'bg-best/10',
    bestPressed: 'bg-best/15 ring-1 ring-inset ring-best/50',
    labelBelow: true,
    pressedLabel: 'text-text-primary',
    pressedDot: '',
    reference: 'dashed',
    outlier: 'triangle',
    bar: false,
  },
  columns: {
    shape: 'w-12 rounded-none border-l border-white/10 first:border-l-0',
    idle: 'hover:bg-white/5',
    pressed: 'bg-white/10',
    bestIdle: '',
    bestPressed: 'bg-best/10',
    labelBelow: true,
    pressedLabel: 'text-text-primary',
    pressedDot: '',
    reference: 'none',
    outlier: 'edge',
    bar: false,
  },
  glow: {
    shape: 'w-14 rounded-lg',
    idle: 'hover:bg-white/5',
    pressed: '',
    bestIdle: '',
    bestPressed: '',
    labelBelow: false,
    pressedLabel: 'text-text-primary',
    pressedDot: 'shadow-[0_0_8px_2px_var(--color-text-primary)]',
    reference: 'none',
    outlier: 'triangle',
    bar: false,
  },
};

const REFERENCE_CLASS_BY_LINE: Record<Exclude<ReferenceLine, 'none'>, string> = {
  dashed: 'border-t border-dashed border-best/45',
  dotted: 'border-t-2 border-dotted border-best/45',
  solid: 'border-t border-best/25',
};

const topPx = (ratio: number): number => PLOT_TOP_PX + ratio * PLOT_SPAN_PX;

interface MarkerProps {
  position: DotChipPosition;
  pressed: boolean;
  spec: LookSpec;
  icon?: LucideIcon;
}

const Marker: FC<MarkerProps> = (props) => {
  const style = { top: topPx(props.position.ratio) };
  const Icon = props.icon;
  const colour = props.pressed ? 'text-text-primary' : 'text-text-tertiary/70';
  if (Icon !== undefined)
    return <Icon aria-hidden size={14} fill="currentColor" strokeWidth={1.5} className={cn(MARKER_CLASS, 'text-best')} style={style} />;
  if (props.position.clamped && props.spec.outlier === 'chevron')
    return <ChevronDown aria-hidden size={14} strokeWidth={3} className={cn(MARKER_CLASS, colour)} style={style} />;
  if (props.position.clamped && props.spec.outlier === 'triangle')
    return <Triangle aria-hidden size={8} fill="currentColor" strokeWidth={0} className={cn(MARKER_CLASS, 'rotate-180', colour)} style={style} />;
  if (props.position.clamped)
    return (
      <>
        <span aria-hidden className={cn(MARKER_CLASS, 'h-1.5 w-px bg-current', colour)} style={{ top: topPx(1) - 5 }} />
        <span aria-hidden data-testid="dot-chip-dot" className={cn(MARKER_CLASS, 'size-1.5 rounded-full bg-current', colour)} style={style} />
      </>
    );
  return (
    <span
      aria-hidden
      data-testid="dot-chip-dot"
      className={cn(
        MARKER_CLASS,
        'size-1.5 rounded-full',
        props.pressed && 'bg-text-primary',
        props.pressed && props.spec.pressedDot,
        !props.pressed && 'bg-text-tertiary/70',
      )}
      style={style}
    />
  );
};

interface PvDotChipProps {
  label: string;
  detail?: string;
  accessibleLabel: string;
  position: DotChipPosition;
  referenceRatio?: number;
  pressed: boolean;
  onPress: () => void;
  tone?: DotChipTone;
  look?: DotChipLook;
  markerIcon?: LucideIcon;
  testId?: string;
}

const chipClass = ({ spec, tone, pressed }: { spec: LookSpec; tone: DotChipTone; pressed: boolean }): string => {
  if (tone === 'best' && pressed) return spec.bestPressed;
  if (tone === 'best') return spec.bestIdle;
  if (pressed) return spec.pressed;
  return spec.idle;
};

export const PvDotChip: FC<PvDotChipProps> = (props) => {
  const tone = props.tone ?? 'neutral';
  const spec = SPEC_BY_DOT_CHIP_LOOK[props.look ?? 'current'];
  const reference = spec.reference;
  const label = (
    <span className="flex flex-col items-center leading-none">
      <PvTypography
        variant="caption"
        noWrap
        tabularNums
        className={cn(tone === 'best' && 'text-best', props.pressed && tone === 'neutral' && spec.pressedLabel)}
      >
        {props.label}
      </PvTypography>
      {props.detail !== undefined && (
        <PvTypography variant="caption" noWrap color="textTertiary" className={cn(tone === 'best' && 'text-best/70')}>
          {props.detail}
        </PvTypography>
      )}
    </span>
  );
  return (
    <button
      type="button"
      aria-pressed={props.pressed}
      aria-label={props.accessibleLabel}
      data-testid={props.testId}
      data-tone={tone}
      onClick={() => {
        if (!props.pressed) props.onPress();
      }}
      className={cn(
        'relative flex shrink-0 flex-col items-center gap-0.5 py-1 transition-colors',
        spec.shape,
        !props.pressed && 'cursor-pointer',
        props.pressed && 'cursor-default',
        chipClass({ spec, tone, pressed: props.pressed }),
      )}
    >
      {!spec.labelBelow && label}
      <span className="relative block h-9 w-full">
        {props.referenceRatio !== undefined && reference !== 'none' && (
          <span aria-hidden className={cn('absolute inset-x-0', REFERENCE_CLASS_BY_LINE[reference])} style={{ top: topPx(props.referenceRatio) }} />
        )}
        <Marker position={props.position} pressed={props.pressed} spec={spec} icon={props.markerIcon} />
      </span>
      {spec.labelBelow && label}
      {spec.bar && props.pressed && (
        <span aria-hidden className={cn('absolute inset-x-2 bottom-0 h-0.5 rounded-full', tone === 'best' ? 'bg-best' : 'bg-text-primary')} />
      )}
    </button>
  );
};
