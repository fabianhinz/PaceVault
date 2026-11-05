import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { fireEvent, waitFor } from '@testing-library/react';
import { useState, type FC } from 'react';
import { useLocation } from 'react-router-dom';
import { useMapScene } from '@/components/mapBackground/hooks/useMapScene.ts';
import { useMapTracks } from '@/components/mapBackground/hooks/useMapTracks.ts';
import { useTrackLayers } from '@/components/mapBackground/hooks/useTrackLayers.ts';
import { sceneHoveredSpan, type MapSceneKind } from '@/components/mapBackground/mapScene.ts';
import type { DeckEventHandlers } from '@/components/mapBackground/hooks/types.ts';
import { SegmentItem } from '@/components/segments/SegmentItem.tsx';
import { SessionItem } from '@/components/sessions/SessionItem.tsx';
import { SegmentsRow } from '@/components/sessions/session/SegmentsRow.tsx';
import { useSessionSegments } from '@/components/segments/hooks/useSessionSegments.ts';
import { INITIAL_MAP_FOCUS_STORE_STATE, useMapFocusStore } from '@/store/mapFocus.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { useSessionReprocessingStore } from '@/store/sessionReprocessing.ts';
import { renderWithProviders } from '@testUtils/render.ts';
import { createMatchMedia, DESKTOP_MIN_WIDTH } from '@testUtils/matchMedia.ts';
import { createMockTrainingSession } from '@pacevault/testing/sessions.ts';
import { createMockSessionGPS } from '@pacevault/testing/gps.ts';
import { createMockSessionRecord } from '@pacevault/testing/records.ts';
import {
  createMockMatchedSegment,
  createMockStoredSegmentPass,
} from '@tests/factories/segments.ts';

vi.mock('@/components/segments/hooks/useSessionSegments.ts', () => ({
  useSessionSegments: vi.fn(),
}));

interface MapFrame {
  path: string;
  scene: MapSceneKind;
  tracksDrawn: boolean;
  hovered: boolean;
  spanHovered: boolean;
}

const NO_HANDLERS: DeckEventHandlers = {};
const session = createMockTrainingSession({ id: 's1', name: 'Morning ride' });
const gpsData = [createMockSessionGPS({ sessionId: 's1' })];
const records = Array.from({ length: 400 }, (_, i) => createMockSessionRecord({ timestamp: i }));
const pass = createMockStoredSegmentPass({
  sessionId: 's1',
  startTimestampSec: 100,
  endTimestampSec: 300,
});
const segment = createMockMatchedSegment({ id: 'seg-1', name: 'Hill', passes: [pass] });

let frames: MapFrame[] = [];

const MapProbe: FC = () => {
  const path = useLocation().pathname;
  const scene = useMapScene();
  const tracks = useMapTracks(gpsData);
  const layers = useTrackLayers({ tracks, eventHandlers: NO_HANDLERS });
  const hovered = useMapFocusStore((s) => s.mapHover?.sceneKey === scene.key);
  const spanHovered = useMapFocusStore(
    (s) => sceneHoveredSpan({ hover: s.mapHover, sceneKey: scene.key }) !== null,
  );
  frames.push({ path, scene: scene.kind, tracksDrawn: layers !== null, hovered, spanHovered });
  return null;
};

const SegmentsTabCard: FC = () => {
  const scene = useMapScene();
  if (scene.kind !== 'segmentTab') return null;
  return <SegmentItem segment={segment} />;
};

const PickPopupCard: FC = () => {
  const open = useState(true);
  if (!open[0]) return null;
  return <SessionItem session={session} onNavigate={() => open[1](false)} />;
};

const SessionSegmentsRow: FC = () => {
  const scene = useMapScene();
  if (scene.kind !== 'session') return null;
  return <SegmentsRow session={session} records={records} />;
};

const framesSinceHover = (): MapFrame[] => {
  const first = frames.findIndex((frame) => frame.hovered);
  return frames.slice(first);
};

const overviewWithoutHover = (frame: MapFrame): boolean => frame.tracksDrawn && !frame.hovered;

describe('map scene click-through', () => {
  beforeEach(() => {
    frames = [];
    window.matchMedia = createMatchMedia(DESKTOP_MIN_WIDTH, { pointerFine: true });
    useMapFocusStore.setState(INITIAL_MAP_FOCUS_STORE_STATE);
    useSessionReprocessingStore.setState({ phase: 'done' });
    useSessionsStore.setState({ sessions: [session] });
    vi.mocked(useSessionSegments).mockReturnValue([{ segment, pass, rank: 1 }]);
  });

  it('S1: a Segments tab card opens its page without all tracks fading back in', async () => {
    const view = renderWithProviders(
      <>
        <SegmentsTabCard />
        <MapProbe />
      </>,
      { initialPath: '/?tab=segments' },
    );
    const card = view.getByRole('button', { name: 'Hill' });

    fireEvent.pointerEnter(card);
    fireEvent.click(card);

    await waitFor(() => expect(frames.at(-1)?.scene).toBe('segmentPage'));
    expect(framesSinceHover().filter(overviewWithoutHover)).toEqual([]);
    expect(useMapFocusStore.getState().mapHover).toBeNull();
  });

  it('S2: a pick popup card opens the session without all tracks flashing in', async () => {
    const view = renderWithProviders(
      <>
        <PickPopupCard />
        <MapProbe />
      </>,
    );
    const card = view.getByTestId('session-item');

    fireEvent.pointerEnter(card);
    fireEvent.click(card);

    await waitFor(() => expect(frames.at(-1)?.scene).toBe('session'));
    expect(framesSinceHover().filter(overviewWithoutHover)).toEqual([]);
    expect(view.queryByTestId('session-item')).not.toBeInTheDocument();
    expect(useMapFocusStore.getState().mapHover).toBeNull();
  });

  it('S4: a session Segments row keeps its overlay until the segment page commits', async () => {
    const view = renderWithProviders(
      <>
        <SessionSegmentsRow />
        <MapProbe />
      </>,
      { initialPath: '/sessions/s1' },
    );
    const row = view.getByRole('button', { name: 'Hill' });

    fireEvent.pointerEnter(row);
    fireEvent.click(row);

    await waitFor(() => expect(frames.at(-1)?.scene).toBe('segmentPage'));
    const sessionFrames = framesSinceHover().filter((frame) => frame.scene === 'session');
    expect(sessionFrames.filter((frame) => !frame.spanHovered)).toEqual([]);
    expect(frames.filter((frame) => frame.scene === 'segmentPage' && frame.tracksDrawn)).toEqual(
      [],
    );
  });
});
