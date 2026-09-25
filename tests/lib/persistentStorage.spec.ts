import { describe, it, expect, vi, afterEach } from 'vitest';
import { requestPersistentStorage } from '@/lib/persistentStorage.ts';

const stubStorage = (storage: Partial<StorageManager> | undefined) => {
  Object.defineProperty(navigator, 'storage', { value: storage, configurable: true });
};

afterEach(() => {
  stubStorage(undefined);
});

describe('persistent storage', () => {
  it('does nothing where the browser has no storage manager', async () => {
    stubStorage(undefined);
    expect(await requestPersistentStorage()).toBe(false);
  });

  it('does not ask again once storage is persistent', async () => {
    const persist = vi.fn(async () => true);
    stubStorage({ persisted: async () => true, persist });

    expect(await requestPersistentStorage()).toBe(true);
    expect(persist).not.toHaveBeenCalled();
  });

  it('asks the browser when storage is not persistent yet', async () => {
    const persist = vi.fn(async () => false);
    stubStorage({ persisted: async () => false, persist });

    expect(await requestPersistentStorage()).toBe(false);
    expect(persist).toHaveBeenCalledOnce();
  });
});
