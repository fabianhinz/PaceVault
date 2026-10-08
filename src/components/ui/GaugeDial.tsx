type GaugeZone = { from: number; to: number; color: string };

type GaugeArcsProps = {
  cx: number;
  cy: number;
  radius: number;
  stroke: number;
  gapDeg: number;
  min: number;
  max: number;
  value: number;
  zones: GaugeZone[];
  valueFill: string;
};

const valueToAngle = (v: number, min: number, max: number) =>
  Math.PI * (1 - (v - min) / (max - min));

const arcPath = (cx: number, cy: number, radius: number, startAngle: number, endAngle: number) => {
  const startX = cx + radius * Math.cos(startAngle);
  const startY = cy - radius * Math.sin(startAngle);
  const endX = cx + radius * Math.cos(endAngle);
  const endY = cy - radius * Math.sin(endAngle);
  let largeArc = 0;
  if (startAngle - endAngle > Math.PI) largeArc = 1;
  return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`;
};

export const GaugeArcs = (props: GaugeArcsProps) => {
  const clamped = Math.max(props.min, Math.min(props.max, props.value));
  const valueAngle = valueToAngle(clamped, props.min, props.max);
  const gapRad = (props.gapDeg * Math.PI) / 180;
  const arc = (startAngle: number, endAngle: number) =>
    arcPath(props.cx, props.cy, props.radius, startAngle, endAngle);

  return (
    <>
      {props.zones.map((zone, i) => {
        const fromAngle = valueToAngle(Math.max(zone.from, props.min), props.min, props.max);
        const toAngle = valueToAngle(Math.min(zone.to, props.max), props.min, props.max);
        const adjFrom = i > 0 ? fromAngle - gapRad / 2 : fromAngle;
        const adjTo = i < props.zones.length - 1 ? toAngle + gapRad / 2 : toAngle;

        if (adjFrom <= adjTo) return null;

        return (
          <path
            key={i}
            d={arc(adjFrom, adjTo)}
            fill="none"
            stroke={zone.color}
            strokeWidth={props.stroke}
            opacity={0.25}
          />
        );
      })}

      {clamped !== props.min && (
        <path
          d={arc(Math.PI, valueAngle)}
          fill="none"
          stroke={props.valueFill}
          strokeWidth={props.stroke}
          strokeLinecap="round"
        />
      )}
    </>
  );
};

type GaugeDialProps = {
  min: number;
  max: number;
  value: number;
  zones: GaugeZone[];
  valueFill: string;
};

export const GaugeDial = (props: GaugeDialProps) => (
  <svg viewBox="0 0 200 115" className="w-full h-full">
    <GaugeArcs
      cx={100}
      cy={100}
      radius={83}
      stroke={14}
      gapDeg={1}
      min={props.min}
      max={props.max}
      value={props.value}
      zones={props.zones}
      valueFill={props.valueFill}
    />
  </svg>
);
