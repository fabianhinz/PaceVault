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
});
