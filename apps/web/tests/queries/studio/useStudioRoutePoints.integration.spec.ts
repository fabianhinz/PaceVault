import { describe, it, expect } from 'vite-plus/test';
import { act, waitFor } from '@testing-library/react';
import {
  invalidateStudioRoutePoints,
  useStudioRoutePoints,
} from '@/queries/studio/useStudioRoutePoints.ts';
import { saveStudioRoutePoints } from '@/lib/storage/db.ts';
import { createMockRoutePoint } from '@pacevault/testing/route.ts';
import { createTestQueryClient } from '@testUtils/queryClient.ts';
import { renderHookWithProviders } from '@testUtils/render.ts';

describe(useStudioRoutePoints.name, () => {
  it("shows points saved after the route's query first ran", async () => {
    const queryClient = createTestQueryClient();
    const view = renderHookWithProviders(() => useStudioRoutePoints({ routeId: 'r1' }), {
      queryClient,
    });
    await waitFor(() => expect(view.result.current.data).toEqual([]));

    const points = [
      createMockRoutePoint({ lat: 47, lng: 11, ele: 500, dist: 0 }),
      createMockRoutePoint({ lat: 47.001, lng: 11.001, ele: 501, dist: 100 }),
    ];
    await saveStudioRoutePoints({ routeId: 'r1', points });
    await act(() => invalidateStudioRoutePoints({ routeId: 'r1' }, queryClient));

    await waitFor(() => expect(view.result.current.data).toEqual(points));
  });
});
