import type { FC } from 'react';
import { useMeasure } from 'react-use';
import { tokens } from '@pacevault/ui/lib/tokens.ts';
import { positionAt, type Pass, type Segment } from './data.ts';
import { useHover } from './hoverStore.ts';
import { BEST_PALETTE } from './bestPalette.ts';

const BASEMAP = '#0e0e0e';
const GRID_STEP = 80;

interface Inset {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface SegmentMapProps {
  segment: Segment;
  selected: Pass;
  best: Pass;
  sportColor: string;
  inset: Inset;
  label: string;
}

const mercatorY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) * (180 / Math.PI);

const projection = ({ geometry, width, height, inset }: { geometry: Array<[number, number]>; width: number; height: number; inset: Inset }) => {
  const xs = geometry.map((p) => p[1]);
  const ys = geometry.map((p) => mercatorY(p[0]));
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const boxWidth = Math.max(1, width - inset.left - inset.right);
  const boxHeight = Math.max(1, height - inset.top - inset.bottom);
  const scale = Math.min(boxWidth / Math.max(1e-9, maxX - minX), boxHeight / Math.max(1e-9, maxY - minY));
  const offsetX = inset.left + (boxWidth - (maxX - minX) * scale) / 2;
  const offsetY = inset.top + (boxHeight - (maxY - minY) * scale) / 2;
  return (lat: number, lng: number): [number, number] => [offsetX + (lng - minX) * scale, offsetY + (maxY - mercatorY(lat)) * scale];
};

const useMarkers = ({ selected, best, segment }: { selected: Pass; best: Pass; segment: Segment }) => {
  const hover = useHover();
  if (hover === null) return { primary: undefined, best: undefined };
  if (hover.kind === 'explorer') {
    let bestPosition: [number, number] | undefined = undefined;
    if (best.sessionId !== selected.sessionId) bestPosition = positionAt(best, hover.seconds);
    return { primary: positionAt(selected, hover.seconds), best: bestPosition };
  }
  const pass = segment.passes.find((p) => p.sessionId === hover.sessionId);
  if (pass === undefined) return { primary: undefined, best: undefined };
  return { primary: positionAt(pass, best.seconds), best: undefined };
};

export const SegmentMap: FC<SegmentMapProps> = (props) => {
  const [ref, size] = useMeasure<HTMLDivElement>();
  const markers = useMarkers({ selected: props.selected, best: props.best, segment: props.segment });
  const project = projection({ geometry: props.segment.geometry, width: size.width, height: size.height, inset: props.inset });
  const path = props.segment.geometry.map((p) => project(p[0], p[1]).map((v) => v.toFixed(1)).join(',')).join(' ');
  const start = props.segment.geometry[0];
  const primary = markers.primary === undefined ? undefined : project(markers.primary[0], markers.primary[1]);
  const bestMarker = markers.best === undefined ? undefined : project(markers.best[0], markers.best[1]);

  return (
    <div ref={ref} className="absolute inset-0" style={{ backgroundColor: BASEMAP }} aria-label={props.label} role="img">
      {size.width > 0 && (
        <svg width={size.width} height={size.height} className="block">
          <defs>
            <pattern id="basemap-grid" width={GRID_STEP} height={GRID_STEP} patternUnits="userSpaceOnUse">
              <path d={`M ${GRID_STEP} 0 L 0 0 0 ${GRID_STEP}`} fill="none" stroke={tokens.white4} strokeWidth={1} />
            </pattern>
          </defs>
          <rect width={size.width} height={size.height} fill="url(#basemap-grid)" />
          <polyline points={path} fill="none" stroke={tokens.mapShadow} strokeOpacity={0.6} strokeWidth={11} strokeLinejoin="round" strokeLinecap="round" />
          <polyline points={path} fill="none" stroke={tokens.mapHighlight} strokeWidth={8} strokeLinejoin="round" strokeLinecap="round" />
          <polyline points={path} fill="none" stroke={props.sportColor} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" />
          {start !== undefined && (
            <circle cx={project(start[0], start[1])[0]} cy={project(start[0], start[1])[1]} r={5} fill={tokens.mapHighlight} stroke={tokens.mapShadow} strokeWidth={2} />
          )}
          {bestMarker !== undefined && (
            <circle data-testid="map-marker-best" cx={bestMarker[0]} cy={bestMarker[1]} r={6} fill={BEST_PALETTE.line} stroke={tokens.mapDotStroke} strokeWidth={2} />
          )}
          {primary !== undefined && (
            <circle data-testid="map-marker" cx={primary[0]} cy={primary[1]} r={7} fill={props.sportColor} stroke={tokens.mapDotStroke} strokeWidth={2} />
          )}
        </svg>
      )}
    </div>
  );
};
