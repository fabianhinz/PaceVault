import { useMemo } from 'react';
import { buildSessionChartRows, gpsByX } from '@/lib/chartData.ts';
import { indexByX } from '@/lib/chartHover.ts';
import { computeRecordExtremes } from '@/lib/recordExtremes.ts';
import {
  buildSessionTerrain,
  climbSpansInMinutes,
  type ClimbSpan,
  type SessionTerrain,
} from '@/lib/sessionTerrain.ts';
import type { SessionRecord, Sport } from '@pacevault/engine/types.ts';

type SessionChartRow = ReturnType<typeof buildSessionChartRows>[number];

interface SessionChartRows {
  terrain: SessionTerrain;
  climbSpans: ClimbSpan[];
  extremes: ReturnType<typeof computeRecordExtremes>;
  rows: SessionChartRow[];
  compactRows: SessionChartRow[];
  byTime: Map<number | string, SessionChartRow>;
  gpsLookup: Map<number, [number, number]>;
}

export const useSessionChartRows = ({
  sport,
  records,
  zoomRange,
}: {
  sport: Sport;
  records: SessionRecord[];
  zoomRange: { from: number; to: number } | null;
}): SessionChartRows => {
  const running = sport === 'running';
  const terrain = useMemo(() => buildSessionTerrain({ sport, records }), [sport, records]);
  const climbSpans = useMemo(
    () => climbSpansInMinutes({ records, climbs: terrain.climbs }),
    [records, terrain],
  );
  const extremes = useMemo(
    () => computeRecordExtremes({ records, gradients: terrain.gradients }),
    [records, terrain],
  );
  const rows = useMemo(
    () => buildSessionChartRows(records, { running, terrain }),
    [records, running, terrain],
  );
  const compactRows = useMemo(() => {
    if (zoomRange) return buildSessionChartRows(records, { running, terrain, range: zoomRange });
    return rows;
  }, [records, running, terrain, zoomRange, rows]);
  const byTime = useMemo(
    () => new Map([...indexByX(rows, 'time'), ...indexByX(compactRows, 'time')]),
    [rows, compactRows],
  );
  const gpsLookup = useMemo(
    () => new Map([...gpsByX(rows, 'time'), ...gpsByX(compactRows, 'time')]),
    [rows, compactRows],
  );
  return { terrain, climbSpans, extremes, rows, compactRows, byTime, gpsLookup };
};
