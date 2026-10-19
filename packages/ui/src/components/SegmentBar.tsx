export interface SegmentBarSegment {
  key: string;
  value: number;
  className?: string;
  color?: string;
}

interface SegmentBarProps {
  segments: SegmentBarSegment[];
}

export const SegmentBar = (props: SegmentBarProps) => {
  let total = 0;
  for (const segment of props.segments) total += segment.value;

  return (
    <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-white/5">
      {total > 0 &&
        props.segments.map((segment) => (
          <div
            key={segment.key}
            className={segment.className}
            style={{ width: `${(segment.value / total) * 100}%`, backgroundColor: segment.color }}
          />
        ))}
    </div>
  );
};
