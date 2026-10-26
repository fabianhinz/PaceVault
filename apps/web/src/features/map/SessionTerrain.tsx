import { useMemo, type FC } from 'react';
import type { LapSpan } from '@/lib/laps.ts';
import { useMapControlsStore } from '@/store/mapControls.ts';
import { useMapTerrainEffect } from './hooks/useMapTerrainEffect.ts';
import { useTerrainLineEffect } from './hooks/useTerrainLineEffect.ts';
import { useTerrainLapStateEffect } from './hooks/useTerrainLapStateEffect.ts';
import { useTerrainHoverPointEffect } from './hooks/useTerrainHoverPointEffect.ts';
import { useTerrainTrackPickingEffect } from './hooks/useTerrainTrackPickingEffect.ts';
import { useTerrainOrbitEffect } from './hooks/useTerrainOrbitEffect.ts';
import { lapVertexBreaks } from './lapPath.ts';
import { terrainLineLayerIds, terrainLineRuns, type LineColor } from './terrainLine.ts';
import { LAP_CASING_SCALE, LAP_DIMMED_BRIGHTNESS, trackModifiers } from './trackColors.ts';
import type { DetailPath } from './zoneColoredPath.ts';

const SESSION_LINE_ID = 'session-terrain';
const NO_PATH: [number, number][] = [];
const NO_COLORS: LineColor[] = [];
const SESSION_LINE_WIDTH = {
  metres: trackModifiers.width.highlighted,
  minPixels: 3,
  casingMetres: trackModifiers.width.highlighted * LAP_CASING_SCALE,
  casingMinPixels: 9,
  selectedMinPixels: 5,
};

const sessionLineBreaks = ({
  detailPath,
  spans,
}: {
  detailPath: DetailPath | null;
  spans: LapSpan[] | undefined;
}) => {
  if (detailPath === null || spans === undefined) return [];
  return lapVertexBreaks({ detailPath, spans });
};

interface SessionTerrainProps {
  detailPath: DetailPath | null;
  onDrawn: (() => void) | undefined;
}

export const SessionTerrain: FC<SessionTerrainProps> = (props) => {
  const lapSelected = useMapControlsStore((s) => s.selectedLapIndex !== null);
  const spans = useMapControlsStore((s) => s.sessionLaps?.spans);
  const path = props.detailPath?.path ?? NO_PATH;
  const colors = props.detailPath?.color ?? NO_COLORS;
  const runs = useMemo(
    () =>
      terrainLineRuns({
        path,
        colors,
        breaks: sessionLineBreaks({ detailPath: props.detailPath, spans }),
      }),
    [path, colors, props.detailPath, spans],
  );

  useMapTerrainEffect();
  useTerrainLineEffect({
    id: SESSION_LINE_ID,
    path,
    runs,
    colors,
    width: SESSION_LINE_WIDTH,
    dimFactor: LAP_DIMMED_BRIGHTNESS,
    dimmed: lapSelected,
    onDrawn: props.onDrawn,
  });
  useTerrainLapStateEffect({ sourceId: SESSION_LINE_ID, detailPath: props.detailPath, runs });
  useTerrainHoverPointEffect();
  useTerrainTrackPickingEffect({
    layerId: terrainLineLayerIds(SESSION_LINE_ID).line,
    detailPath: props.detailPath,
  });
  useTerrainOrbitEffect();

  return null;
};
