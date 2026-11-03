import { useRef, type FC } from 'react';
import { Crown } from 'lucide-react';
import { ComposedChart, Line, Scatter, XAxis, YAxis } from 'recharts';
import { useMeasure } from 'react-use';
import { tokens } from '@pacevault/ui/lib/tokens.ts';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { useScrollFadeEffect } from '@pacevault/ui/hooks/useScrollFadeEffect.ts';
import { MS_PER_DAY } from '@pacevault/engine/time.ts';
import { useDragScroll } from '@/lib/hooks/useDragScroll.ts';
import { useSegmentFocusStore } from '@/store/segmentFocus.ts';
import type { Segment, StoredSegmentPass } from '@/lib/workers/segmentsContract.ts';
import {
  SCATTER_WINDOW_PASSES,
  passPositionAt,
  passesByDate,
  rollingMedianSec,
} from './segmentPasses.ts';
import { useScatterScrollEndEffect } from './hooks/useScatterScrollEndEffect.ts';

const HEIGHT_PX = 112;
const PLOT_PADDING_PX = 12;
const ROW_BLEED_PX = 12;
const SIDE_PADDING_PX = PLOT_PADDING_PX + ROW_BLEED_PX;
const MIN_Y_PADDING_SEC = 2;
const Y_PADDING_RATIO = 0.12;
const DOT_RADIUS_PX = 4;
const DOT_OPACITY = 0.45;
const HIT_RADIUS_PX = 9;
const SELECTED_STROKE_PX = 1.5;
const HOVER_RADIUS_PX = 5.5;
const CROWN_SIZE_PX = 10;
const TREND_Z_INDEX = 700;
const DOT_CLASS = 'transition-[r] duration-100 group-hover:[r:5.5px]';

interface ScatterPoint {
  date: number;
  durationSec: number;
  medianSec: number | null;
  sessionId: string;
}

interface DotShapeProps {
  cx?: number;
  cy?: number;
  payload?: ScatterPoint;
}

interface PassScatterProps {
  segment: Segment;
  best: StoredSegmentPass;
  selectedSessionId: string;
  sportColor: string;
  onSelect: (sessionId: string) => void;
  onVisibleChange: (sessionIds: Set<string> | null) => void;
}

const contentWidthPx = ({
  viewportPx,
  ordered,
}: {
  viewportPx: number;
  ordered: StoredSegmentPass[];
}): number => {
  const first = ordered[0]?.date;
  const last = ordered[ordered.length - 1]?.date;
  const windowStart = ordered[ordered.length - SCATTER_WINDOW_PASSES]?.date;
  if (first === undefined || last === undefined || windowStart === undefined) return viewportPx;
  const windowSpanMs = Math.max(MS_PER_DAY, last - windowStart);
  return 2 * SIDE_PADDING_PX + (viewportPx - 2 * SIDE_PADDING_PX) * ((last - first) / windowSpanMs);
};

const raisedOrder = ({
  sessionId,
  best,
  selectedSessionId,
}: {
  sessionId: string;
  best: StoredSegmentPass;
  selectedSessionId: string;
}): number => {
  if (sessionId === best.sessionId) return 2;
  if (sessionId === selectedSessionId) return 1;
  return 0;
};

export const PassScatter: FC<PassScatterProps> = (props) => {
  const ordered = passesByDate(props.segment);
  const medians = rollingMedianSec(ordered);
  const data: ScatterPoint[] = ordered.map((pass, i) => ({
    date: pass.date,
    durationSec: pass.durationSec,
    medianSec: medians[i] ?? null,
    sessionId: pass.sessionId,
  }));
  const durations = ordered.map((pass) => pass.durationSec);
  const fastestSec = Math.min(...durations);
  const slowestSec = Math.max(...durations);
  const paddingSec = Math.max(MIN_Y_PADDING_SEC, (slowestSec - fastestSec) * Y_PADDING_RATIO);
  const firstDate = ordered[0]?.date ?? 0;
  const lastDate = ordered[ordered.length - 1]?.date ?? 0;
  const measure = useMeasure<HTMLDivElement>();
  const viewportPx = measure[1].width;
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragScroll = useDragScroll();
  const widthPx = contentWidthPx({ viewportPx, ordered });
  const scrollable = widthPx > viewportPx + 0.5;
  useScrollFadeEffect(scrollRef, { axis: 'x' });
  useScatterScrollEndEffect({ ref: scrollRef, contentWidthPx: widthPx });

  const xOf = (date: number) =>
    SIDE_PADDING_PX +
    ((date - firstDate) / Math.max(1, lastDate - firstDate)) * (widthPx - 2 * SIDE_PADDING_PX);
  const onScroll = () => {
    const element = scrollRef.current;
    if (element === null || !scrollable) return;
    const fromPx = element.scrollLeft;
    const toPx = fromPx + element.clientWidth;
    props.onVisibleChange(
      new Set(
        ordered
          .filter((pass) => xOf(pass.date) >= fromPx && xOf(pass.date) <= toPx)
          .map((pass) => pass.sessionId),
      ),
    );
  };

  const renderDot = (dot: DotShapeProps) => {
    const point = dot.payload;
    if (point === undefined || dot.cx === undefined || dot.cy === undefined) return <g />;
    const cx = dot.cx;
    const cy = dot.cy;
    const isBest = point.sessionId === props.best.sessionId;
    const isSelected = point.sessionId === props.selectedSessionId;
    const pass = ordered.find((candidate) => candidate.sessionId === point.sessionId);
    let stroke: string | undefined = undefined;
    if (isSelected) stroke = props.sportColor;
    let fill = props.sportColor;
    let fillOpacity = DOT_OPACITY;
    if (isBest) {
      fill = tokens.best;
      fillOpacity = 1;
    }
    return (
      <g
        data-testid="scatter-dot"
        className="group cursor-pointer"
        onClick={() => {
          if (dragScroll.dragged.current) return;
          props.onSelect(point.sessionId);
        }}
        onPointerEnter={() => {
          if (pass === undefined) return;
          useSegmentFocusStore.getState().hoverPass({
            sessionId: pass.sessionId,
            marker: passPositionAt({
              segment: props.segment,
              pass,
              elapsedSec: props.best.durationSec,
            }),
          });
        }}
        onPointerLeave={() => useSegmentFocusStore.getState().clearPassFocus()}
      >
        <circle cx={cx} cy={cy} r={HIT_RADIUS_PX} fill="transparent" />
        <circle
          cx={cx}
          cy={cy}
          r={DOT_RADIUS_PX}
          fill={fill}
          fillOpacity={fillOpacity}
          stroke={stroke}
          strokeWidth={SELECTED_STROKE_PX}
          className={DOT_CLASS}
        />
        {isBest && (
          <Crown
            x={cx - CROWN_SIZE_PX / 2}
            y={cy - HOVER_RADIUS_PX - CROWN_SIZE_PX - 1}
            width={CROWN_SIZE_PX}
            height={CROWN_SIZE_PX}
            fill="currentColor"
            strokeWidth={1.5}
            className="pointer-events-none text-best"
          />
        )}
      </g>
    );
  };
  const dotOrder = [...data].sort(
    (a, b) =>
      raisedOrder({
        sessionId: a.sessionId,
        best: props.best,
        selectedSessionId: props.selectedSessionId,
      }) -
      raisedOrder({
        sessionId: b.sessionId,
        best: props.best,
        selectedSessionId: props.selectedSessionId,
      }),
  );

  return (
    <div className="-mx-3">
      <div ref={measure[0]} className="h-28" data-testid="pass-scatter">
        <div
          ref={scrollRef}
          className={cn(
            'h-full [scrollbar-width:none]',
            scrollable &&
              'scroll-fade-x cursor-grab overflow-x-auto overflow-y-hidden overscroll-x-contain active:cursor-grabbing',
            !scrollable && 'overflow-hidden',
          )}
          onScroll={onScroll}
          onPointerDown={dragScroll.onPointerDown}
          onPointerMove={dragScroll.onPointerMove}
          onPointerUp={dragScroll.onPointerUp}
          onPointerLeave={dragScroll.onPointerUp}
        >
          {viewportPx > 0 && (
            <ComposedChart
              width={widthPx}
              height={HEIGHT_PX}
              data={data}
              margin={{
                top: PLOT_PADDING_PX,
                right: SIDE_PADDING_PX,
                bottom: PLOT_PADDING_PX,
                left: SIDE_PADDING_PX,
              }}
            >
              <XAxis hide dataKey="date" type="number" domain={[firstDate, lastDate]} />
              <YAxis
                hide
                dataKey="durationSec"
                type="number"
                reversed
                domain={[fastestSec - paddingSec, slowestSec + paddingSec]}
              />
              <Line
                dataKey="medianSec"
                type="linear"
                stroke={tokens.textSecondary}
                strokeWidth={2}
                dot={false}
                activeDot={false}
                isAnimationActive={false}
                zIndex={TREND_Z_INDEX}
                className="pointer-events-none"
              />
              <Scatter
                data={dotOrder}
                dataKey="durationSec"
                shape={renderDot}
                isAnimationActive={false}
              />
            </ComposedChart>
          )}
        </div>
      </div>
    </div>
  );
};
