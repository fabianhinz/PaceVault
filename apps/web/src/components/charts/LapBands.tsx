import { useDeferredValue, useMemo } from 'react';
import { ReferenceArea } from 'recharts';
import { bandsOnRows } from '@/lib/analysis/laps.ts';
import { useMapControlsStore } from '@/store/mapControls.ts';
import { LapBandShape } from '@/components/charts/LapBandShape.tsx';
import type { AreaShapeProps } from '@/components/charts/types.ts';

interface LapBandsProps<K extends string, T extends Record<K, number>> {
  rows: readonly T[];
  xKey: K;
  yAxisId: string;
}

export const LapBands = <K extends string, T extends Record<K, number>>(
  props: LapBandsProps<K, T>,
) => {
  const sessionLaps = useDeferredValue(useMapControlsStore((s) => s.sessionLaps));
  const rows = props.rows;
  const xKey = props.xKey;
  const yAxisId = props.yAxisId;

  return useMemo(() => {
    if (!sessionLaps) return [];
    const activeByIndex = new Map<number, boolean>();
    for (const lap of sessionLaps.analysis) {
      activeByIndex.set(lap.lapIndex, lap.intensity === 'active');
    }
    const bands = bandsOnRows({ bands: sessionLaps.bands, xs: rows.map((row) => row[xKey]) });
    return bands.map((band) => (
      <ReferenceArea
        key={band.lapIndex}
        yAxisId={yAxisId}
        x1={band.from}
        x2={band.to}
        ifOverflow="visible"
        shape={(shapeProps: AreaShapeProps) => (
          <LapBandShape
            x={shapeProps.x}
            y={shapeProps.y}
            width={shapeProps.width}
            height={shapeProps.height}
            lapIndex={band.lapIndex}
            active={activeByIndex.get(band.lapIndex) ?? true}
          />
        )}
      />
    ));
  }, [sessionLaps, rows, xKey, yAxisId]);
};
