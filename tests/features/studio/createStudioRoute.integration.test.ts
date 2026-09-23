import { describe, it, expect, beforeEach } from 'vitest';
import { createStudioRouteFromGpx } from '@/features/studio/createStudioRoute.ts';
import { useStudioStore } from '@/store/studio.ts';

const gpx = (offset: number) => `<?xml version="1.0"?>
<gpx version="1.1" creator="test" xmlns="http://www.topografix.com/GPX/1/1">
  <trk><trkseg>
    <trkpt lat="${47.1 + offset}" lon="11.2"/>
    <trkpt lat="${47.2 + offset}" lon="11.3"/>
  </trkseg></trk>
</gpx>`;

describe('createStudioRouteFromGpx', () => {
  beforeEach(() => {
    useStudioStore.setState({ routes: [] });
  });

  it('gives each newly imported route the next colour in the rotation', async () => {
    for (let i = 0; i < 3; i++) {
      await createStudioRouteFromGpx(gpx(i), {
        fallbackName: `Route ${i}`,
        sourceFileName: `route-${i}.gpx`,
      });
    }

    expect(useStudioStore.getState().routes.map((r) => r.color)).toEqual([
      'fuchsia',
      'emerald',
      'amber',
    ]);
  });
});
