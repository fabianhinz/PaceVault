import { useMemo, type ReactNode } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { ElevationChart } from '@/components/charts/ElevationChart.tsx';
import { GradeChart } from '@/components/charts/GradeChart.tsx';
import { sessionTimeXAxis } from '@/lib/chartTheme.ts';
import type { buildSessionChartRows } from '@/lib/chartData.ts';
import type { SessionTerrain } from '@/lib/sessionTerrain.ts';
import type { ZoneScale } from '@/lib/zoneColors.ts';
import type { SpeedScale } from '@/lib/speedScale.ts';
import { HrChart } from '@/features/sessions/charts/HrChart.tsx';
import { PowerChart } from '@/features/sessions/charts/PowerChart.tsx';
import { SpeedChart } from '@/features/sessions/charts/SpeedChart.tsx';
import { CadenceChart } from '@/features/sessions/charts/CadenceChart.tsx';
import { PaceChart } from '@/features/sessions/charts/PaceChart.tsx';
import { GradeAdjustedPaceChart } from '@/features/sessions/charts/GradeAdjustedPaceChart.tsx';

interface SessionChartNodes {
  hr: ReactNode;
  power: ReactNode;
  speed: ReactNode;
  elevation: ReactNode;
  cadence: ReactNode;
  grade: ReactNode;
  pace: ReactNode;
  gap: ReactNode;
}

export const useSessionChartNodes = ({
  compactRows,
  running,
  hrScale,
  powerScale,
  paceScale,
  speedColorScale,
  onHover,
  onSelectTime,
  onZoomComplete,
  terrain,
}: {
  compactRows: ReturnType<typeof buildSessionChartRows>;
  running: boolean;
  hrScale: ZoneScale | undefined;
  powerScale: ZoneScale | undefined;
  paceScale: ZoneScale | undefined;
  speedColorScale: SpeedScale | undefined;
  onHover: (time: number | null) => void;
  onSelectTime: (time: number) => void;
  onZoomComplete: (from: string | number, to: string | number) => void;
  terrain: SessionTerrain;
}): SessionChartNodes =>
  useMemo(
    () => ({
      hr: (
        <HrChart
          data={compactRows}
          zoneScale={hrScale}
          onActiveTimeChange={onHover}
          onZoomComplete={onZoomComplete}
          onSelectTime={onSelectTime}
        />
      ),
      power: (
        <PowerChart
          data={compactRows}
          zoneScale={powerScale}
          onActiveTimeChange={onHover}
          onZoomComplete={onZoomComplete}
          onSelectTime={onSelectTime}
        />
      ),
      speed: (
        <SpeedChart
          data={compactRows}
          colorScale={speedColorScale}
          onActiveTimeChange={onHover}
          onZoomComplete={onZoomComplete}
          onSelectTime={onSelectTime}
        />
      ),
      elevation: (
        <ElevationChart
          data={compactRows}
          xAxis={sessionTimeXAxis}
          onActiveXChange={onHover}
          onZoomComplete={onZoomComplete}
          onSelectX={onSelectTime}
          lapBands
          climbs={terrain.climbs.length > 0}
        />
      ),
      cadence: (
        <CadenceChart
          data={compactRows}
          seriesName={running ? m.ui_chart_series_cadence_running() : m.ui_chart_series_cadence()}
          onActiveTimeChange={onHover}
          onZoomComplete={onZoomComplete}
          onSelectTime={onSelectTime}
        />
      ),
      grade: (
        <GradeChart
          data={compactRows}
          xAxis={sessionTimeXAxis}
          onActiveXChange={onHover}
          onZoomComplete={onZoomComplete}
          onSelectX={onSelectTime}
          lapBands
        />
      ),
      pace: (
        <PaceChart
          data={compactRows}
          zoneScale={paceScale}
          onActiveTimeChange={onHover}
          onZoomComplete={onZoomComplete}
          onSelectTime={onSelectTime}
        />
      ),
      gap: (
        <GradeAdjustedPaceChart
          data={compactRows}
          onActiveTimeChange={onHover}
          onZoomComplete={onZoomComplete}
          onSelectTime={onSelectTime}
        />
      ),
    }),
    [
      compactRows,
      running,
      hrScale,
      powerScale,
      paceScale,
      speedColorScale,
      onHover,
      onSelectTime,
      onZoomComplete,
      terrain,
    ],
  );
