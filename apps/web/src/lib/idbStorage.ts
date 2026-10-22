import type { StateStorage } from 'zustand/middleware';
import { getDB } from './db.ts';

export const idbStorage: StateStorage = {
  async getItem(name: string): Promise<string | null> {
    const db = await getDB();
    return (await db.get('kv', name)) ?? null;
  },
  async setItem(name: string, value: string): Promise<void> {
    const db = await getDB();
    await db.put('kv', value, name);
  },
  async removeItem(name: string): Promise<void> {
    const db = await getDB();
    await db.delete('kv', name);
  },
};
