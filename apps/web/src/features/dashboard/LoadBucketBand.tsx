import type { FC } from 'react';
import { ReferenceArea } from 'recharts';
import { useChartHoverX } from '@/store/chartHover.ts';
import { loadBucketKey, type LoadBucket, type LoadGroupBy } from '@/lib/loadAxis.ts';
import { DASHBOARD_HOVER_GROUP } from './hooks/useDashboardChartEvents.ts';

interface BandShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

interface LoadBucketBandProps {
  dates: string[];
  buckets: Map<string, LoadBucket>;
  groupBy: LoadGroupBy;
}

export const LoadBucketBand: FC<LoadBucketBandProps> = (props) => {
  const hoveredX = useChartHoverX(DASHBOARD_HOVER_GROUP);
  if (hoveredX === null) return null;
  const bucket = props.buckets.get(
    loadBucketKey({ day: String(hoveredX), groupBy: props.groupBy }),
  );
  if (!bucket) return null;
  const first = props.dates.indexOf(bucket.from);
  const last = props.dates.indexOf(bucket.to);
  if (first < 0 || last < 0) return null;
  const start = Math.max(first - 1, 0);
  const end = Math.min(last + 1, props.dates.length - 1);
  const steps = end - start;
  if (steps === 0) return null;
  return (
    <ReferenceArea
      x1={props.dates[start]}
      x2={props.dates[end]}
      ifOverflow="visible"
      shape={(shape: BandShapeProps) => {
        if (shape.x === undefined || shape.y === undefined) return <g />;
        if (shape.width === undefined || shape.height === undefined) return <g />;
        const half = shape.width / steps / 2;
        const left = start < first ? half : 0;
        const right = end > last ? half : 0;
        return (
          <rect
            x={shape.x + left}
            y={shape.y}
            width={Math.max(0, shape.width - left - right)}
            height={shape.height}
            className="fill-white"
            fillOpacity={0.1}
          />
        );
      }}
    />
  );
};
