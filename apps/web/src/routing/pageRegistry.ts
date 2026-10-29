import type { LabsTab } from '@/routing/labsTab.ts';

export const SUPPORTED_PAGES = {
  dashboard: 'dashboard',
  sessions: 'sessions',
  sessionDetail: 'sessionDetail',
  tripDetail: 'tripDetail',
  studioDetail: 'studioDetail',
  labs: 'labs',
  settings: 'settings',
} as const;
export type SupportedPage = (typeof SUPPORTED_PAGES)[keyof typeof SUPPORTED_PAGES];

export type SessionsTab = 'log' | 'trips' | 'records';
export type StudioDetailTab = 'overview' | 'tools';
export type SettingsTab = 'general' | 'data';
type NoParams = Record<string, never>;

export const PATTERN_BY_PAGE = {
  dashboard: '/',
  sessions: '/sessions',
  sessionDetail: '/sessions/:id',
  tripDetail: '/trips/:id',
  studioDetail: '/studio/:id',
  labs: '/labs',
  settings: '/settings',
} satisfies Record<SupportedPage, string>;

const withTab = ({ path, tab }: { path: string; tab: string | undefined }): string => {
  if (tab === undefined) return path;
  return `${path}?${new URLSearchParams({ tab }).toString()}`;
};

export const URL_BY_PAGE = {
  dashboard: (_params: NoParams) => '/',
  sessions: (params: { tab?: SessionsTab }) => withTab({ path: '/sessions', tab: params.tab }),
  sessionDetail: (params: { sessionId: string }) =>
    `/sessions/${encodeURIComponent(params.sessionId)}`,
  tripDetail: (params: { tripId: string }) => `/trips/${encodeURIComponent(params.tripId)}`,
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
