import type { QueryClient } from '@tanstack/react-query';
import type { SessionGPS } from '@pacevault/engine/types.ts';
import { buildSessionGPS } from '@pacevault/engine/gps.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { useUserStore } from '@/store/user.ts';
import { useTripsStore } from '@/store/trips.ts';
import { useImportProgressStore } from '@/store/importProgress.ts';
import { invalidatePersonalBests } from '@/features/records/hooks/usePersonalBests.ts';
import { createStudioRouteFromPoints } from '@/features/studio/createStudioRoute.ts';
import { bulkSaveSessionData, saveSessionGPS } from '@/lib/indexeddb.ts';
import { buildDemoDataset, DEMO_SEED } from './buildDemoDataset.ts';
import { parseDemoRoutes } from './demoRecords.ts';

/** Builds the deterministic demo dataset and stores it like an import. */
export const loadDemoData = async (queryClient: QueryClient): Promise<number> => {
  useImportProgressStore.getState().beginImport({ foreground: true });

  const routesModule = await import('./demoRoutes.json');
  const routes = parseDemoRoutes(routesModule.default);
  if (!routes) throw new Error('Demo routes are invalid');

  const dataset = buildDemoDataset({ seed: DEMO_SEED, today: new Date(), routes });

  useUserStore.getState().setProfile(dataset.profile);
  useImportProgressStore.getState().setImportTotal(dataset.sessions.length);

  const gpsTracks: SessionGPS[] = [];
  for (const entry of dataset.sessionData) {
    const gps = buildSessionGPS(entry.sessionId, entry.records);
    if (gps) gpsTracks.push(gps);
    useImportProgressStore.getState().advanceImport();
  }

  useImportProgressStore.getState().markImportSaving();
  await Promise.all([bulkSaveSessionData(dataset.sessionData), ...gpsTracks.map(saveSessionGPS)]);

  useSessionsStore.getState().addSessions(dataset.sessions);
  for (const trip of dataset.trips) {
    const tripId = useTripsStore.getState().createTrip(trip.name, trip.description);
    useTripsStore.getState().updateTrip(tripId, trip.name, trip.sessionIds, trip.description);
  }
  for (const route of dataset.studioRoutes) {
    await createStudioRouteFromPoints(route.points, {
      name: route.name,
      sourceFileName: route.sourceFileName,
    });
  }

  invalidatePersonalBests(queryClient);
  useImportProgressStore.getState().finishImport({
    kind: 'imported',
    imported: dataset.sessions.length,
    duplicated: 0,
    failed: 0,
  });

  return dataset.sessions.length;
};
