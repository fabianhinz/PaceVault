import { z } from 'zod';
import type { StateStorage } from 'zustand/middleware';
import { SESSION_DERIVATION_VERSION } from '@pacevault/engine/sessionDerivation.ts';
import { getDB, idbStorage } from './db.ts';

export const SESSIONS_DERIVATION_MARKER_KEY = 'sessions-derivation-version';

const markerSchema = z.coerce.number().int().nonnegative();

const readMarker = (raw: string | undefined): number | undefined => {
  if (raw === undefined) return undefined;
  const parsed = markerSchema.safeParse(raw);
  if (!parsed.success) return undefined;
  return parsed.data;
};

export const claimSessionsDerivationVersion = async (): Promise<'claimed' | 'newer'> => {
  const db = await getDB();
  const tx = db.transaction('kv', 'readwrite');
  const marker = readMarker(await tx.store.get(SESSIONS_DERIVATION_MARKER_KEY));
  if (marker !== undefined && marker > SESSION_DERIVATION_VERSION) {
    await tx.done;
    return 'newer';
  }
  if (marker !== SESSION_DERIVATION_VERSION) {
    await tx.store.put(String(SESSION_DERIVATION_VERSION), SESSIONS_DERIVATION_MARKER_KEY);
  }
  await tx.done;
  return 'claimed';
};

const writeUnlessNewerVersion = async ({
  name,
  value,
  onNewerVersion,
}: {
  name: string;
  value: string;
  onNewerVersion: () => void;
}): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction('kv', 'readwrite');
  const marker = readMarker(await tx.store.get(SESSIONS_DERIVATION_MARKER_KEY));
  if (marker !== undefined && marker > SESSION_DERIVATION_VERSION) {
    await tx.done;
    onNewerVersion();
    return;
  }
  await tx.store.put(value, name);
  await tx.done;
};

export const createGuardedSessionsStorage = (guard: {
  isWriteAllowed: () => boolean;
  onNewerVersion: () => void;
}): StateStorage & { flush: () => Promise<void> } => {
  let pendingWrite: Promise<void> = Promise.resolve();

  return {
    getItem: (name) => idbStorage.getItem(name),
    setItem: (name, value) => {
      if (!guard.isWriteAllowed()) return pendingWrite;
      pendingWrite = pendingWrite
        .then(() => writeUnlessNewerVersion({ name, value, onNewerVersion: guard.onNewerVersion }))
        .catch((err: unknown) => console.error('Persisting sessions failed:', err));
      return pendingWrite;
    },
    removeItem: (name) => idbStorage.removeItem(name),
    flush: () => pendingWrite,
  };
};
