import type { FC } from 'react';
import { Heart, Zap, Gauge, Mountain, Timer, TrendingUp, ArrowUpDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PvChartRow } from '@pacevault/ui/components/pvChartsCard/PvChartRow.tsx';
import { PvChartsCard } from '@pacevault/ui/components/pvChartsCard/PvChartsCard.tsx';
import { PvZoomResetPill } from '@pacevault/ui/components/pvChartsCard/PvZoomResetPill.tsx';
import { hasSeriesValues } from '@/lib/chartData.ts';
import type { ChartHoverX } from '@/store/chartHover.ts';
import {
  railFixed1,
  railGain,
  railInt,
  railLoss,
  railPace,
  railPaceFromSecPerKm,
  railSigned1,
  railVam,
} from '@/lib/railFormat.ts';
import { climbSpanAt } from '@/lib/sessionTerrain.ts';
import { stepsPerMinute } from '@pacevault/engine/cadence.ts';
import type { MetricId } from '@/lib/explanations.ts';
import { SeriesRail } from '@/components/charts/SeriesRail.tsx';
import type { StatRailNote } from '@pacevault/ui/components/pvStatRail/types.ts';
import { sportIcon } from '@/lib/sportIcons.ts';
import { formatChartTime } from '@/lib/chartTheme.ts';
import { useSyncedChartZoom } from '@/lib/hooks/useSyncedChartZoom.ts';
import { tokens, type TokenColor } from '@pacevault/ui/lib/tokens.ts';
import type { SessionRecord, TrainingSession } from '@pacevault/engine/types.ts';
import { m } from '@pacevault/i18n/messages.js';
import type { ZoneScale } from '@/lib/zoneColors.ts';
import { zoneLabel } from './zoneLabel.ts';
import { MetricLabel } from '@/components/MetricLabel.tsx';
import { HOVER_GROUP } from './types.ts';
import { useSessionChartRows } from './hooks/useSessionChartRows.ts';
import { useSessionChartScales } from './hooks/useSessionChartScales.ts';
import { useSessionChartHover } from './hooks/useSessionChartHover.ts';
import { useSessionRailStats } from './hooks/useSessionRailStats.ts';
import { useSessionChartNodes } from './hooks/useSessionChartNodes.tsx';

interface ChartEntry {
  key: string;
  title: string;
  icon: LucideIcon;
  color: TokenColor;
  dataPresent: boolean;
  metricId?: MetricId;
  rail: React.ReactNode;
  chart: React.ReactNode;
}

const formatHoverTime = (x: ChartHoverX) => formatChartTime(Number(x));

const railCadence = ({ cadence, running }: { cadence: number | undefined; running: boolean }) => {
  if (cadence === undefined || !running) return cadence;
  return stepsPerMinute(cadence);
};

const vamNote = ({
  vam,
  message,
}: {
  vam: number | undefined;
  message: (inputs: { vam: string }) => string;
}): StatRailNote | undefined => {
  if (vam === undefined) return undefined;
  return { text: message({ vam: railVam(vam) }), color: tokens.chartClimb };
};

const zoneNote = ({ scale, value }: { scale: ZoneScale | undefined; value: number | null }) => {
  if (!scale || value === null) return undefined;
  const band = scale.bandAt(value);
  return { text: zoneLabel(band), color: band.color };
};

interface SessionChartsExplorerProps {
  records: SessionRecord[];
  session: TrainingSession;
}

export const SessionChartsExplorer: FC<SessionChartsExplorerProps> = (props) => {
  const running = props.session.sport === 'running';
  const zoom = useSyncedChartZoom();
  const chartRows = useSessionChartRows({
    sport: props.session.sport,
    records: props.records,
    zoomRange: zoom.zoomRange,
  });
  const scales = useSessionChartScales({ date: props.session.date, records: props.records });
  const hover = useSessionChartHover(chartRows.gpsLookup);
  const railStats = useSessionRailStats({
    session: props.session,
    records: props.records,
    terrain: chartRows.terrain,
    extremes: chartRows.extremes,
    zoomRange: zoom.zoomRange,
  });
  const chartNodes = useSessionChartNodes({
    compactRows: chartRows.compactRows,
    running,
    hrScale: scales.hrScale,
    powerScale: scales.powerScale,
    paceScale: scales.paceScale,
    speedColorScale: scales.speedColorScale,
    onHover: hover.onHover,
    onSelectTime: hover.onSelectTime,
    onZoomComplete: zoom.onZoomComplete,
    terrain: chartRows.terrain,
  });

  const charts: ChartEntry[] = [
    {
      key: 'hr',
      title: m.ui_chart_title_hr(),
      icon: Heart,
      color: tokens.chartHr,
      metricId: 'avgHr',
      dataPresent: hasSeriesValues(chartRows.rows, 'hr'),
      rail: (
        <SeriesRail
          group={HOVER_GROUP}
          unit="bpm"
          formatX={formatHoverTime}
          rest={{
            header: m.ui_rail_avg(),
            value: railInt(railStats.stats.avgHr),
            secondary: `${m.ui_rail_max()} ${railInt(railStats.stats.maxHr)}`,
          }}
          readingAt={(x) => {
            const point = chartRows.byTime.get(x);
            if (!point) return undefined;
            return {
              value: railInt(point.hr),
              secondary: `${m.ui_rail_avg()} ${railInt(railStats.stats.avgHr)}`,
              note: zoneNote({ scale: scales.hrScale, value: point.hr }),
            };
          }}
        />
      ),
      chart: chartNodes.hr,
    },
    {
      key: 'power',
      title: m.ui_zones_tab_power(),
      icon: Zap,
      color: tokens.chartPower,
      metricId: 'normalizedPower',
      dataPresent: hasSeriesValues(chartRows.rows, 'power'),
      rail: (
        <SeriesRail
          group={HOVER_GROUP}
          unit="W"
          formatX={formatHoverTime}
          rest={railStats.powerRest}
          readingAt={(x) => {
            const point = chartRows.byTime.get(x);
            if (!point) return undefined;
            return {
              value: railInt(point.power),
              secondary: `${railStats.powerRest.header} ${railStats.powerRest.value}`,
              note: zoneNote({ scale: scales.powerScale, value: point.power }),
            };
          }}
        />
      ),
      chart: chartNodes.power,
    },
    {
      key: 'speed',
      title: m.ui_laps_col_speed(),
      icon: Gauge,
      color: tokens.chartSpeed,
      metricId: 'avgSpeed',
      dataPresent: hasSeriesValues(chartRows.rows, 'speed'),
      rail: (
        <SeriesRail
          group={HOVER_GROUP}
          unit="km/h"
          formatX={formatHoverTime}
          rest={{
            header: m.ui_rail_avg(),
            value: railFixed1(railStats.avgSpeedKmh),
            secondary: `${m.ui_rail_max()} ${railFixed1(railStats.maxSpeedKmh)}`,
          }}
          readingAt={(x) => {
            const point = chartRows.byTime.get(x);
            if (!point) return undefined;
            return {
              value: railFixed1(point.speed),
              secondary: `${m.ui_rail_avg()} ${railFixed1(railStats.avgSpeedKmh)}`,
            };
          }}
        />
      ),
      chart: chartNodes.speed,
    },
    {
      key: 'pace',
      title: m.ui_zones_tab_pace(),
      icon: Timer,
      color: tokens.chartPace,
      metricId: 'avgPace',
      dataPresent: hasSeriesValues(chartRows.rows, 'pace'),
      rail: (
        <SeriesRail
          group={HOVER_GROUP}
          unit="/km"
          formatX={formatHoverTime}
          rest={{
            header: m.ui_rail_avg(),
            value: railPaceFromSecPerKm(railStats.stats.avgPaceSecPerKm),
            secondary: `${m.ui_rail_best()} ${railPaceFromSecPerKm(railStats.stats.bestPaceSecPerKm)}`,
          }}
          readingAt={(x) => {
            const point = chartRows.byTime.get(x);
            if (!point) return undefined;
            return {
              value: railPace(point.pace),
              secondary: `${m.ui_rail_avg()} ${railPaceFromSecPerKm(railStats.stats.avgPaceSecPerKm)}`,
              note: zoneNote({ scale: scales.paceScale, value: point.pace }),
            };
          }}
        />
      ),
      chart: chartNodes.pace,
    },
    {
      key: 'gap',
      title: m.exp_grade_adjusted_pace_friendly_name(),
      icon: ArrowUpDown,
      color: tokens.chartGap,
      metricId: 'gradeAdjustedPace',
      dataPresent: hasSeriesValues(chartRows.rows, 'gap'),
      rail: (
        <SeriesRail
          group={HOVER_GROUP}
          unit="/km"
          formatX={formatHoverTime}
          rest={{
            header: m.ui_rail_avg(),
            value: railPaceFromSecPerKm(railStats.stats.gapSecPerKm),
          }}
          readingAt={(x) => {
            const point = chartRows.byTime.get(x);
            if (!point) return undefined;
            return {
              value: railPace(point.gap),
              secondary: `${m.ui_rail_avg()} ${railPaceFromSecPerKm(railStats.stats.gapSecPerKm)}`,
            };
          }}
        />
      ),
      chart: chartNodes.gap,
    },
    {
      key: 'elevation',
      title: m.ui_stat_elevation(),
      icon: Mountain,
      color: tokens.chartElevation,
      metricId: railStats.elevationMetricId,
      dataPresent: hasSeriesValues(chartRows.rows, 'elevation'),
      rail: (
        <SeriesRail
          group={HOVER_GROUP}
          unit="m"
          formatX={formatHoverTime}
          rest={{
            header: '',
            value: railGain(railStats.stats.elevationGain),
            secondary: `${railLoss(railStats.stats.elevationLoss)} m`,
            note: vamNote({ vam: railStats.stats.vam, message: m.ui_rail_vam_avg }),
          }}
          readingAt={(x) => {
            const point = chartRows.byTime.get(x);
            if (!point) return undefined;
            return {
              value: railInt(point.elevation),
              secondary: `${railGain(railStats.stats.elevationGain)} m`,
              note: vamNote({
                vam: climbSpanAt({ spans: chartRows.climbSpans, minute: Number(x) })?.vam,
                message: m.ui_rail_vam,
              }),
            };
          }}
        />
      ),
      chart: chartNodes.elevation,
    },
    {
      key: 'grade',
      title: m.ui_chart_title_grade(),
      icon: TrendingUp,
      color: tokens.chartGrade,
      dataPresent: hasSeriesValues(chartRows.rows, 'grade'),
      rail: (
        <SeriesRail
          group={HOVER_GROUP}
          unit="%"
          formatX={formatHoverTime}
          rest={railStats.gradeRest}
          readingAt={(x) => {
            const point = chartRows.byTime.get(x);
            if (!point) return undefined;
            return {
              value: railSigned1(point.grade),
              secondary: railStats.gradeReadingSecondary,
            };
          }}
        />
      ),
      chart: chartNodes.grade,
    },
    {
      key: 'cadence',
      title: m.ui_stat_cadence(),
      icon: sportIcon[props.session.sport],
      color: tokens.chartCadence,
      metricId: 'cadence',
      dataPresent: hasSeriesValues(chartRows.rows, 'cadence'),
      rail: (
        <SeriesRail
          group={HOVER_GROUP}
          unit={running ? 'spm' : 'rpm'}
          formatX={formatHoverTime}
          rest={{
            header: m.ui_rail_avg(),
            value: railInt(railCadence({ cadence: railStats.stats.avgCadence, running })),
            secondary: `${m.ui_rail_max()} ${railInt(railCadence({ cadence: railStats.stats.maxCadence, running }))}`,
          }}
          readingAt={(x) => {
            const point = chartRows.byTime.get(x);
            if (!point) return undefined;
            return {
              value: railInt(point.cadence),
              secondary: `${m.ui_rail_avg()} ${railInt(railCadence({ cadence: railStats.stats.avgCadence, running }))}`,
            };
          }}
        />
      ),
      chart: chartNodes.cadence,
    },
  ];

  const visibleCharts = charts.filter((c) => c.dataPresent);

  if (visibleCharts.length === 0) return null;

  return (
    <PvChartsCard
      zoomReset={
        <PvZoomResetPill
          label={m.ui_chart_reset_zoom()}
          zoomed={zoom.zoomed}
          onReset={zoom.resetZoom}
        />
      }
    >
      {visibleCharts.map((chart) => (
        <PvChartRow
          key={chart.key}
          title={chart.title}
          icon={chart.icon}
          color={chart.color}
          info={
            chart.metricId !== undefined ? (
              <MetricLabel metricId={chart.metricId} size="sm" iconOnly />
            ) : undefined
          }
          rail={chart.rail}
        >
          {chart.chart}
        </PvChartRow>
      ))}
    </PvChartsCard>
  );
};
