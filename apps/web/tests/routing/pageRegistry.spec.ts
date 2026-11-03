import { describe, it, expect } from 'vite-plus/test';
import { pageUrl } from '@/routing/pageRegistry.ts';

describe(pageUrl.name, () => {
  it('encodes a path parameter', () => {
    expect(pageUrl({ page: 'sessionDetail', params: { sessionId: 'a/b' } })).toBe(
      '/sessions/a%2Fb',
    );
  });

  it('appends the tab as a query parameter', () => {
    expect(pageUrl({ page: 'labs', params: { tab: 'studio' } })).toBe('/labs?tab=studio');
  });

  it('opens the dashboard without a query unless a tab is given', () => {
    expect(pageUrl({ page: 'dashboard', params: {} })).toBe('/');
    expect(pageUrl({ page: 'dashboard', params: { tab: 'segments' } })).toBe('/?tab=segments');
  });

  it('builds a segment URL with its origin session', () => {
    expect(pageUrl({ page: 'segmentDetail', params: { segmentId: 'a:0-10' } })).toBe(
      '/segments/a%3A0-10',
    );
    expect(pageUrl({ page: 'segmentDetail', params: { segmentId: 'a:0-10', from: 's1' } })).toBe(
      '/segments/a%3A0-10?from=s1',
    );
  });
});
