import { useLayoutEffect, useRef, type FC, type PointerEvent } from 'react';
import { Crown } from 'lucide-react';
import { ComposedChart, Line, Scatter, XAxis, YAxis } from 'recharts';
import { useMeasure } from 'react-use';
import { tokens } from '@pacevault/ui/lib/tokens.ts';
import { passesByDate, rollingMedian, SCATTER_WINDOW_PASSES, type Pass, type Segment } from './data.ts';
import { setHover } from './hoverStore.ts';
import { BEST_PALETTE } from './bestPalette.ts';

const HEIGHT = 112;
const PLOT_PADDING = 12;
const ROW_BLEED = 12;
// The scroll area bleeds over the row's padding; the extra inner margin keeps the latest dot in line with the row content.
const SIDE_PADDING = PLOT_PADDING + ROW_BLEED;
const FADE_EDGE_TOLERANCE = 1;
const SCROLL_END_MS = 150;
const DRAG_THRESHOLD_PX = 4;
const DAY_MS = 86_400_000;
const DOT_RADIUS = 4;
const DOT_OPACITY = 0.45;
const HIT_RADIUS = 9;
const SELECTED_STROKE = 1.5;
const HOVER_RADIUS = 5.5;
const DOT_CLASS = 'transition-[r] duration-100 group-hover:[r:5.5px]';
const CROWN_SIZE = 10;
const TREND_Z_INDEX = 700;

interface ScatterPoint {
  date: number;
  seconds: number;
  median: number | null;
  sessionId: string;
}

interface PassScatterProps {
  segment: Segment;
  best: Pass;
  selected: Pass;
  sportColor: string;
  onSelect: (sessionId: string) => void;
  onWindowChange: (ids: Set<string> | null) => void;
}

interface DotProps {
  cx?: number;
  cy?: number;
  payload?: ScatterPoint;
}

const contentWidthFor = ({ viewport, ordered }: { viewport: number; ordered: Pass[] }) => {
  const first = ordered[0]?.date ?? 0;
  const last = ordered[ordered.length - 1]?.date ?? 0;
  if (ordered.length <= SCATTER_WINDOW_PASSES) return viewport;
  const windowStart = ordered[ordered.length - SCATTER_WINDOW_PASSES]?.date ?? first;
  const windowSpan = Math.max(DAY_MS, last - windowStart);
  return 2 * SIDE_PADDING + (viewport - 2 * SIDE_PADDING) * ((last - first) / windowSpan);
};

const toggleAttribute = ({ element, name, on }: { element: HTMLElement; name: string; on: boolean }) => {
  if (on) element.setAttribute(name, '');
  else element.removeAttribute(name);
};

// Horizontal twin of the kit's scrollFadeEdges + useScrollFadeEffect (packages/ui/src/lib/scrollFade.ts).
const updateFade = (element: HTMLElement) => {
  const hiddenRight = element.scrollWidth - element.clientWidth - element.scrollLeft;
  toggleAttribute({ element, name: 'data-fade-left', on: element.scrollLeft > FADE_EDGE_TOLERANCE });
  toggleAttribute({ element, name: 'data-fade-right', on: hiddenRight > FADE_EDGE_TOLERANCE });
};

const useDragScroll = () => {
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse') return;
    drag.current = { x: event.clientX, left: event.currentTarget.scrollLeft, moved: false };
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    if (start === null) return;
    const delta = event.clientX - start.x;
    if (!start.moved && Math.abs(delta) < DRAG_THRESHOLD_PX) return;
    start.moved = true;
    event.currentTarget.scrollLeft = start.left - delta;
  };
  const onPointerUp = () => {
    suppressClick.current = drag.current?.moved === true;
    drag.current = null;
  };
  return { onPointerDown, onPointerMove, onPointerUp, onPointerLeave: onPointerUp, suppressClick };
};

export const PassScatter: FC<PassScatterProps> = (props) => {
  const ordered = passesByDate(props.segment);
  const medians = rollingMedian(ordered);
  const data: ScatterPoint[] = ordered.map((pass, i) => ({
    date: pass.date,
    seconds: pass.seconds,
    median: medians[i] ?? null,
    sessionId: pass.sessionId,
  }));
  const seconds = ordered.map((p) => p.seconds);
  const fastest = Math.min(...seconds);
  const slowest = Math.max(...seconds);
  const padding = Math.max(2, (slowest - fastest) * 0.12);
  const first = ordered[0]?.date ?? 0;
  const last = ordered[ordered.length - 1]?.date ?? 0;
  const [measureRef, size] = useMeasure<HTMLDivElement>();
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollEnd = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dragScroll = useDragScroll();
  const width = contentWidthFor({ viewport: size.width, ordered });
  const scrollable = width > size.width + 0.5;

  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (element === null) return;
    element.scrollLeft = element.scrollWidth;
    updateFade(element);
  }, [width]);

  const xOf = (date: number) => SIDE_PADDING + ((date - first) / Math.max(1, last - first)) * (width - 2 * SIDE_PADDING);
  const reportWindow = (element: HTMLDivElement) => {
    if (!scrollable) return props.onWindowChange(null);
    const from = element.scrollLeft;
    const to = element.scrollLeft + element.clientWidth;
    props.onWindowChange(new Set(ordered.filter((p) => xOf(p.date) >= from && xOf(p.date) <= to).map((p) => p.sessionId)));
  };
  const onScroll = () => {
    const element = scrollRef.current;
    if (element === null) return;
    updateFade(element);
    clearTimeout(scrollEnd.current);
    scrollEnd.current = setTimeout(() => reportWindow(element), SCROLL_END_MS);
  };

  const renderDot = (dot: DotProps) => {
    const point = dot.payload;
    if (point === undefined || dot.cx === undefined || dot.cy === undefined) return <g />;
    const isBest = point.sessionId === props.best.sessionId;
    const isSelected = point.sessionId === props.selected.sessionId;
    const ring = isSelected ? { stroke: props.sportColor, strokeWidth: SELECTED_STROKE } : {};
    let mark = <circle cx={dot.cx} cy={dot.cy} r={DOT_RADIUS} fill={props.sportColor} fillOpacity={DOT_OPACITY} className={DOT_CLASS} {...ring} />;
    if (isBest) mark = <circle cx={dot.cx} cy={dot.cy} r={DOT_RADIUS} fill={BEST_PALETTE.line} className={DOT_CLASS} {...ring} />;
    return (
      <g
        data-testid="scatter-dot"
        data-session={point.sessionId}
        className="group cursor-pointer"
        onClick={() => {
          if (dragScroll.suppressClick.current) return;
          props.onSelect(point.sessionId);
        }}
        onPointerEnter={() => setHover({ kind: 'pass', sessionId: point.sessionId })}
        onPointerLeave={() => setHover(null)}
      >
        <circle cx={dot.cx} cy={dot.cy} r={HIT_RADIUS} fill="transparent" />
        {mark}
        {isBest && <Crown x={dot.cx - CROWN_SIZE / 2} y={dot.cy - HOVER_RADIUS - CROWN_SIZE - 1} width={CROWN_SIZE} height={CROWN_SIZE} fill="currentColor" strokeWidth={1.5} className="pointer-events-none" style={{ color: BEST_PALETTE.crown }} />}
      </g>
    );
  };
  const raised = (sessionId: string) => {
    if (sessionId === props.best.sessionId) return 2;
    if (sessionId === props.selected.sessionId) return 1;
    return 0;
  };
  const dotOrder = [...data].sort((a, b) => raised(a.sessionId) - raised(b.sessionId));

  return (
    <div className="-mx-3">
      <div ref={measureRef} style={{ height: HEIGHT }} data-testid="pass-scatter">
        <div
          ref={scrollRef}
          data-testid="scatter-scroll"
          className={scrollable ? 'scroll-fade-x h-full cursor-grab overflow-x-auto overflow-y-hidden overscroll-x-contain active:cursor-grabbing' : 'h-full overflow-hidden'}
          style={{ scrollbarWidth: 'none' }}
          onScroll={onScroll}
          onPointerDown={dragScroll.onPointerDown}
          onPointerMove={dragScroll.onPointerMove}
          onPointerUp={dragScroll.onPointerUp}
          onPointerLeave={dragScroll.onPointerLeave}
        >
          <div style={{ width, height: HEIGHT }}>
          {size.width > 0 && (
            <ComposedChart width={width} height={HEIGHT} data={data} margin={{ top: PLOT_PADDING, right: SIDE_PADDING, bottom: PLOT_PADDING, left: SIDE_PADDING }}>
              <XAxis hide dataKey="date" type="number" domain={[first, last]} />
              <YAxis hide dataKey="seconds" type="number" reversed domain={[fastest - padding, slowest + padding]} />
              <Line dataKey="median" type="linear" stroke={tokens.textSecondary} strokeWidth={2} dot={false} activeDot={false} isAnimationActive={false} zIndex={TREND_Z_INDEX} className="pointer-events-none" />
              <Scatter data={dotOrder} dataKey="seconds" shape={renderDot} isAnimationActive={false} />
            </ComposedChart>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};
