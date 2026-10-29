import { useState, type PointerEvent, type FC } from 'react';
import { useMeasure } from 'react-use';
import {
  SPARKLINE_PAD,
  sparklineDateAt,
  sparklinePath,
} from '@/components/settings/profileHistory.ts';

interface ThresholdSparklineProps {
  points: { date: number; value: number }[];
  domain: [number, number];
  today: number;
  color: string;
  fresh: boolean;
  onScrub: (date: number | null) => void;
}

export const ThresholdSparkline: FC<ThresholdSparklineProps> = (props) => {
  const [ref, box] = useMeasure<HTMLDivElement>();
  const [guideX, setGuideX] = useState<number | null>(null);

  const path = sparklinePath({
    points: props.points,
    domain: props.domain,
    box,
    today: props.today,
  });
  const historyPresent = path.lastDot !== undefined;

  const handleMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!historyPresent || box.width === 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(
      SPARKLINE_PAD,
      Math.min(box.width - SPARKLINE_PAD, event.clientX - rect.left),
    );
    setGuideX(x);
    props.onScrub(
      sparklineDateAt({ x, domain: props.domain, width: box.width, today: props.today }),
    );
  };

  const handleLeave = () => {
    setGuideX(null);
    props.onScrub(null);
  };

  let dot = path.lastDot;
  if (dot !== undefined && !props.fresh) dot = { x: box.width - SPARKLINE_PAD, y: dot.y };

  return (
    <div
      ref={ref}
      className="h-full w-full touch-pan-y"
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      onClick={(event) => {
        if (historyPresent) event.stopPropagation();
      }}
    >
      {box.width > 0 && (
        <svg width={box.width} height={box.height} className="block overflow-visible" aria-hidden>
          {!historyPresent && (
            <line
              x1={0}
              x2={box.width}
              y1={box.height - 1}
              y2={box.height - 1}
              className="stroke-guide-baseline"
              strokeDasharray="2 3"
            />
          )}
          {historyPresent && (
            <>
              {guideX !== null && (
                <line
                  x1={guideX}
                  x2={guideX}
                  y1={0}
                  y2={box.height}
                  className="stroke-guide-hover"
                />
              )}
              <line
                x1={path.todayX}
                x2={path.todayX}
                y1={0}
                y2={box.height}
                className="stroke-guide-today"
                strokeDasharray="1 2"
              />
              <path
                d={path.line}
                stroke={props.color}
                strokeWidth={1.5}
                fill="none"
                strokeLinejoin="round"
              />
            </>
          )}
          {dot !== undefined && <circle cx={dot.x} cy={dot.y} r={2} fill={props.color} />}
          {dot !== undefined && props.fresh && (
            <circle
              cx={dot.x}
              cy={dot.y}
              r={2}
              fill="none"
              stroke={props.color}
              strokeWidth={1.5}
              opacity={0}
            >
              <animate attributeName="r" from="2" to="9" dur="1.4s" repeatCount="3" />
              <animate attributeName="opacity" from="0.9" to="0" dur="1.4s" repeatCount="3" />
            </circle>
          )}
        </svg>
      )}
    </div>
  );
};
