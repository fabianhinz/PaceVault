import { useEffect, useMemo, useState } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Dot,
} from 'recharts';
import type { MouseHandlerDataParam } from 'recharts/types/synchronisation/types';
import { Heart, HeartPulse, Timer, Weight, Zap, type LucideIcon } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { getLocale } from '@/paraglide/runtime.js';
import { valueAt, type DatedValue } from '@/packages/engine/datedValue.ts';
import type { UserProfile } from '@/types/index.ts';
import { useUserStore } from '@/store/user.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { useChartHoverStore, useChartHoverX } from '@/store/chartHover.ts';
import { ChartsCard, ChartRow } from '@/components/ui/ChartsCard.tsx';
import { TabsTrigger } from '@/components/ui/Tabs.tsx';
import { useDevice } from '@/lib/hooks/useDevice.ts';
import { chartTheme } from '@/lib/chartTheme.ts';
import { chartHoverHandlers, hoverOnlyTooltip } from '@/lib/chartHover.ts';
import { DASHBOARD_Y_AXIS_WIDTH } from '@/lib/dashboardVolume.ts';
import { formatPaceInput, toDateString } from '@/lib/formatters.ts';
import {
  PROFILE_HISTORY_HOVER_GROUP,
  profileHistoryDomain,
  profileHistoryRows,
  profileHistorySeries,
} from '@/lib/profileHistory.ts';
import { tokens } from '@/lib/tokens.ts';
import { formatDashboardDate } from '@/features/dashboard/dashboardDate.ts';
import { ProfileHistoryRail } from './ProfileHistoryRail.tsx';

type ProfileHistoryKey = 'ftp' | 'thresholdPace' | 'restHr' | 'maxHr' | 'weight';

interface ProfileHistoryValue {
  key: ProfileHistoryKey;
  label: () => string;
  icon: LucideIcon;
  color: string;
  unit: string;
  format: (value: number) => string;
  historyOf: (profile: UserProfile) => DatedValue<number>[];
}

const intFmt = new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 0 });
const weightFmt = new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 1 });
const formatInt = (value: number) => intFmt.format(value);

const VALUES: ProfileHistoryValue[] = [
  {
    key: 'ftp',
    label: m.ui_profile_history_tab_ftp,
    icon: Zap,
    color: tokens.chartPower,
    unit: 'W',
    format: formatInt,
    historyOf: (profile) => profile.thresholds.ftp ?? [],
  },
  {
    key: 'thresholdPace',
    label: m.ui_profile_history_tab_pace,
    icon: Timer,
    color: tokens.chartPace,
    unit: '/km',
    format: formatPaceInput,
    historyOf: (profile) => profile.thresholds.thresholdPace ?? [],
  },
  {
    key: 'restHr',
    label: m.ui_profile_history_tab_rest_hr,
    icon: HeartPulse,
    color: tokens.chartHr,
    unit: 'bpm',
    format: formatInt,
    historyOf: (profile) => profile.thresholds.restHr,
  },
  {
    key: 'maxHr',
    label: m.ui_profile_history_tab_max_hr,
    icon: Heart,
    color: tokens.chartHr,
    unit: 'bpm',
    format: formatInt,
    historyOf: (profile) => profile.thresholds.maxHr,
  },
  {
    key: 'weight',
    label: m.ui_profile_history_tab_weight,
    icon: Weight,
    color: tokens.chartGrade,
    unit: 'kg',
    format: (value) => weightFmt.format(value),
    historyOf: (profile) => profile.weight ?? [],
  },
];

const isProfileHistoryKey = (value: string): value is ProfileHistoryKey =>
  VALUES.some((entry) => entry.key === value);

const onHover = (x: number | null) => {
  if (x === null) {
    useChartHoverStore.getState().clearChartHover(PROFILE_HISTORY_HOVER_GROUP);
    return;
  }
  useChartHoverStore.getState().setChartHover(PROFILE_HISTORY_HOVER_GROUP, x);
};

const onMouseMove = (e: MouseHandlerDataParam) => {
  if (e.activeLabel != null) onHover(Number(e.activeLabel));
};

const formatAxisDate = (x: number) => formatDashboardDate(toDateString(x));

const firstSessionDateOf = (sessions: { date: number }[]): number | undefined => {
  let first: number | undefined = undefined;
  for (const session of sessions) {
    if (first === undefined || session.date < first) first = session.date;
  }
  return first;
};

const initialKey = (profile: UserProfile | null): ProfileHistoryKey => {
  if (!profile || (profile.thresholds.ftp ?? []).length > 0) return 'ftp';
  return 'restHr';
};

export const ProfileHistoryChart = () => {
  const profile = useUserStore((s) => s.profile);
  const firstSessionDate = useSessionsStore((s) => firstSessionDateOf(s.sessions));
  const isDesktop = useDevice().isDesktop;
  const hoveredX = useChartHoverX(PROFILE_HISTORY_HOVER_GROUP);
  const [selected, setSelected] = useState<ProfileHistoryKey>(() => initialKey(profile));

  useEffect(() => () => onHover(null), []);

  const context = useMemo(
    () => ({ firstSessionDate, createdAt: profile?.createdAt ?? 0, today: Date.now() }),
    [firstSessionDate, profile],
  );

  if (!profile) return null;

  const value = VALUES.find((entry) => entry.key === selected) ?? VALUES[0];
  if (!value) return null;
  const history = value.historyOf(profile);
  const series = profileHistorySeries(history, context);
  const domain = profileHistoryDomain(
    VALUES.map((entry) => entry.historyOf(profile)),
    context,
  );
  const rows = profileHistoryRows(series.points, domain);
  let activeDate: number | undefined = undefined;
  if (typeof hoveredX === 'number') {
    activeDate = valueAt(
      series.points.map((point) => ({ date: point.date, value: point.date })),
      hoveredX,
    );
  }

  const tabs = (
    <TabsPrimitive.Root
      value={selected}
      onValueChange={(next) => {
        if (isProfileHistoryKey(next)) setSelected(next);
      }}
    >
      <TabsPrimitive.List className="mb-1 inline-flex flex-wrap gap-1">
        {VALUES.map((entry) => {
          const Icon = entry.icon;
          return (
            <TabsTrigger
              key={entry.key}
              value={entry.key}
              disabled={entry.historyOf(profile).length === 0}
              className="flex-none gap-1 rounded-lg px-2 py-1 text-xs"
            >
              <Icon size={12} />
              {entry.label()}
            </TabsTrigger>
          );
        })}
      </TabsPrimitive.List>
    </TabsPrimitive.Root>
  );

  return (
    <ChartsCard zoomReset={null}>
      <ChartRow
        title={m.ui_profile_history_title()}
        secondary={m.ui_profile_history_subtitle()}
        height="h-64"
        above={isDesktop ? undefined : tabs}
        rail={
          <ProfileHistoryRail
            history={history}
            unit={value.unit}
            min={series.min}
            max={series.max}
            format={value.format}
          />
        }
      >
        <div className="flex h-full flex-col">
          {isDesktop && tabs}
          <div className="min-h-0 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={rows} onMouseMove={onMouseMove} {...chartHoverHandlers(onHover)}>
                <XAxis
                  dataKey="date"
                  type="number"
                  scale="time"
                  domain={domain}
                  ticks={domain}
                  tick={chartTheme.tick}
                  tickLine={false}
                  axisLine={chartTheme.axisLine}
                  tickFormatter={formatAxisDate}
                />
                <YAxis
                  tick={chartTheme.tick}
                  tickLine={false}
                  axisLine={false}
                  width={DASHBOARD_Y_AXIS_WIDTH}
                  tickCount={3}
                  domain={['auto', 'auto']}
                  tickFormatter={value.format}
                />
                <RechartsTooltip {...hoverOnlyTooltip} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={value.color}
                  strokeWidth={2}
                  connectNulls
                  dot={(dotProps) => {
                    const active = dotProps.payload?.date === activeDate;
                    return (
                      <Dot
                        cx={dotProps.cx}
                        cy={dotProps.cy}
                        r={active ? 4 : 3.5}
                        fill={value.color}
                        stroke={active ? tokens.textPrimary : tokens.surface}
                        strokeWidth={active ? 2 : 1.5}
                      />
                    );
                  }}
                  activeDot={false}
                  isAnimationActive={false}
                  name={value.label()}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </ChartRow>
    </ChartsCard>
  );
};
