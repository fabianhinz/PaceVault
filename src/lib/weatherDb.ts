import type { SessionWeather } from './weather.ts';
import { getDB } from './db.ts';

export const getSessionWeather = async (sessionId: string): Promise<SessionWeather | undefined> => {
  const db = await getDB();
  return db.get('session-weather', sessionId);
};

export const saveSessionWeather = async (weather: SessionWeather): Promise<void> => {
  const db = await getDB();
  await db.put('session-weather', weather);
};

export const deleteSessionWeather = async (sessionId: string): Promise<void> => {
  const db = await getDB();
  await db.delete('session-weather', sessionId);
};
