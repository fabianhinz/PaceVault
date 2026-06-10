import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { SessionRecord, SessionLap, SessionGPS } from '@/packages/engine/types.ts';
import type { SessionWeather } from './weather.ts';

export interface EnduranceTrackerDB extends DBSchema {
  'session-records': {
    key: string;
    value: { sessionId: string; records: SessionRecord[] };
  };
  'session-laps': {
    key: string;
    value: { sessionId: string; laps: SessionLap[] };
  };
  'session-gps': {
    key: number;
    value: SessionGPS;
    indexes: { sessionId: string };
  };
  'session-weather': {
    key: string;
    value: SessionWeather;
  };
  'fit-files': {
    key: string;
    value: { sessionId: string; fileName: string; data: ArrayBuffer };
  };
  kv: {
    key: string;
    value: string;
  };
}

const DB_NAME = 'endurance-tracker';
const DB_VERSION = 3;

let dbPromise: Promise<IDBPDatabase<EnduranceTrackerDB>> | null = null;

export const getDB = (): Promise<IDBPDatabase<EnduranceTrackerDB>> => {
  if (!dbPromise) {
    dbPromise = openDB<EnduranceTrackerDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore('session-records', { keyPath: 'sessionId' });
          db.createObjectStore('session-laps', { keyPath: 'sessionId' });
          db.createObjectStore('kv');
          const gpsStore = db.createObjectStore('session-gps', {
            autoIncrement: true,
          });
          gpsStore.createIndex('sessionId', 'sessionId', { unique: false });
        }
        if (oldVersion < 2) {
          db.createObjectStore('fit-files', { keyPath: 'sessionId' });
        }
        if (oldVersion < 3) {
          db.createObjectStore('session-weather', { keyPath: 'sessionId' });
        }
      },
    });
  }
  return dbPromise;
};

export const resetDBInstance = (): void => {
  dbPromise = null;
};
