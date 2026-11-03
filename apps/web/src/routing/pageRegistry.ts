import type { LabsTab } from '@/routing/labsTab.ts';
import type { DashboardTab } from '@/routing/dashboardTab.ts';

export const SUPPORTED_PAGES = {
  dashboard: 'dashboard',
  sessions: 'sessions',
  sessionDetail: 'sessionDetail',
  tripDetail: 'tripDetail',
  segmentDetail: 'segmentDetail',
  studioDetail: 'studioDetail',
  labs: 'labs',
  settings: 'settings',
} as const;
export type SupportedPage = (typeof SUPPORTED_PAGES)[keyof typeof SUPPORTED_PAGES];

export type SessionsTab = 'log' | 'trips' | 'records';
export type StudioDetailTab = 'overview' | 'tools';
export type SettingsTab = 'general' | 'data';

export const PATTERN_BY_PAGE = {
  dashboard: '/',
  sessions: '/sessions',
  sessionDetail: '/sessions/:id',
  tripDetail: '/trips/:id',
  segmentDetail: '/segments/:id',
  studioDetail: '/studio/:id',
  labs: '/labs',
  settings: '/settings',
} satisfies Record<SupportedPage, string>;

const withQuery = ({
  path,
  query,
}: {
  path: string;
  query: Record<string, string | undefined>;
}): string => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, value);
  }
  const search = params.toString();
  if (search === '') return path;
  return `${path}?${search}`;
};

const withTab = ({ path, tab }: { path: string; tab: string | undefined }): string =>
  withQuery({ path, query: { tab } });

export const URL_BY_PAGE = {
  dashboard: (params: { tab?: DashboardTab }) => withTab({ path: '/', tab: params.tab }),
  sessions: (params: { tab?: SessionsTab }) => withTab({ path: '/sessions', tab: params.tab }),
  sessionDetail: (params: { sessionId: string }) =>
    `/sessions/${encodeURIComponent(params.sessionId)}`,
  tripDetail: (params: { tripId: string }) => `/trips/${encodeURIComponent(params.tripId)}`,
  segmentDetail: (params: { segmentId: string; from?: string }) =>
    withQuery({
      path: `/segments/${encodeURIComponent(params.segmentId)}`,
      query: { from: params.from },
    }),
  studioDetail: (params: { routeId: string; tab?: StudioDetailTab }) =>
    withTab({ path: `/studio/${encodeURIComponent(params.routeId)}`, tab: params.tab }),
  labs: (params: { tab?: LabsTab }) => withTab({ path: '/labs', tab: params.tab }),
  settings: (params: { tab?: SettingsTab }) => withTab({ path: '/settings', tab: params.tab }),
} satisfies Record<SupportedPage, (params: never) => string>;

export type ResolvePageParams<P extends SupportedPage> = Parameters<(typeof URL_BY_PAGE)[P]>[0];

export type PageTarget = {
  [P in SupportedPage]: { page: P; params: ResolvePageParams<P> };
}[SupportedPage];

export const pageUrl = (target: PageTarget): string => {
  const build = URL_BY_PAGE[target.page] as (params: PageTarget['params']) => string;
  return build(target.params);
};
