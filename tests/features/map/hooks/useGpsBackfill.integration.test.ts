import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGPSBackfill } from '@/features/map/hooks/useGpsBackfill.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { useImportProgressStore } from '@/store/importProgress.ts';
import { useSessionReprocessingStore } from '@/store/sessionReprocessing.ts';
import { makeSession } from '@tests/factories/sessions.ts';

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

describe('useGPSBackfill', () => {
  it('a backfill cancelled while it reads the stored GPS leaves no worker running', async () => {
    vi.stubGlobal('Worker', FakeWorker);
    useSessionReprocessingStore.setState({ phase: 'done' });
    useSessionsStore.setState({
      sessions: [makeSession({ id: 'ride', hasDetailedRecords: true })],
    });

    renderHook(() => useGPSBackfill());
    act(() => useImportProgressStore.getState().beginReprocessing());
    await act(() => new Promise((resolve) => setTimeout(resolve, 50)));

    expect(workers.live).toBe(0);
  });
});
