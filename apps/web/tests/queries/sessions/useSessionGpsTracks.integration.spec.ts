import { describe, it, expect, vi, afterEach } from 'vite-plus/test';
import { act } from '@testing-library/react';
import { useSessionGpsTracks } from '@/queries/sessions/useSessionGpsTracks.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { useSessionReprocessingStore } from '@/store/sessionReprocessing.ts';
import { createMockTrainingSession } from '@pacevault/testing/sessions.ts';
import { renderHookWithProviders } from '@testUtils/render.ts';

const workers = { live: 0 };

class FakeWorker {
  onmessage: (() => void) | null = null;
  onerror: (() => void) | null = null;
  terminated = false;

  constructor() {
    workers.live += 1;
  }

  postMessage = () => undefined;

  terminate = () => {
    if (this.terminated) return;
    this.terminated = true;
    workers.live -= 1;
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  workers.live = 0;
});

describe(useSessionGpsTracks.name, () => {
  it('a track build cancelled while it reads the stored GPS leaves no worker running', async () => {
    vi.stubGlobal('Worker', FakeWorker);
    useSessionReprocessingStore.setState({ phase: 'done' });
    useSessionsStore.setState({
      sessions: [createMockTrainingSession({ id: 'ride', hasDetailedRecords: true })],
    });

    const view = renderHookWithProviders(() => useSessionGpsTracks());
    view.unmount();
    await act(() => new Promise((resolve) => setTimeout(resolve, 50)));

    expect(workers.live).toBe(0);
  });
});
