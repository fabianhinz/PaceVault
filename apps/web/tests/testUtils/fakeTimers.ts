import { vi } from 'vite-plus/test';

// The intervals.icu request pacing waits on setTimeout and reads performance.now; faking both lets a
// spec run hundreds of paced requests without real waiting. Date stays at the time tests/setup.ts set.
export const fakeRequestTimers = (): void => {
  vi.useFakeTimers({
    toFake: ['Date', 'setTimeout', 'clearTimeout', 'performance'],
    now: Date.now(),
  });
};

// setImmediate stays real, so fake IndexedDB keeps working between the fake timer steps.
const nextMacrotask = (): Promise<void> =>
  new Promise((resolve) => {
    setImmediate(resolve);
  });

export const settleWithFakeTimers = async <T>(promise: Promise<T>): Promise<T> => {
  let settled = false;
  const markSettled = () => {
    settled = true;
  };
  void promise.then(markSettled, markSettled);
  while (!settled) {
    await vi.advanceTimersToNextTimerAsync();
    await nextMacrotask();
  }
  return promise;
};
