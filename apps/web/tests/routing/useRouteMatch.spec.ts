import { describe, expect, it } from 'vite-plus/test';
import { useRouteMatch } from '@/routing/useRouteMatch.ts';
import { renderHookWithProviders } from '@testUtils/render.ts';

describe(useRouteMatch.name, () => {
  it('decodes an encoded id so a segment page finds its segment', () => {
    const hook = renderHookWithProviders(() => useRouteMatch('segmentDetail'), {
      initialPath: '/segments/lead%3A0-1000',
    });

    expect(hook.result.current).toEqual({ id: 'lead:0-1000' });
  });
});
