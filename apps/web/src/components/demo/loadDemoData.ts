import type { QueryClient } from '@tanstack/react-query';
import type { SessionGPS } from '@pacevault/engine/types.ts';
import { buildSessionGPS } from '@/lib/analysis/gpsTrack.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { useUserStore } from '@/store/user.ts';
import { useTripsStore } from '@/store/trips.ts';
import { useImportProgressStore } from '@/store/importProgress.ts';
import { invalidatePersonalBests } from '@/queries/records/usePersonalBests.ts';
import { invalidateSessionGps } from '@/queries/sessions/useSessionGps.ts';
import { createStudioRouteFromPoints } from '@/components/studio/createStudioRoute.ts';
import { bulkSaveSessionData, saveSessionGPS } from '@/lib/storage/db.ts';
import { trainingLoadHrSignature } from '@/lib/analysis/sessionStress.ts';
import { buildDemoDataset, DEMO_SEED, type DemoDataset } from './buildDemoDataset.ts';
import { parseDemoRoutes, type DemoRoutesJson } from '@/lib/demo/demoRecords.ts';

const loadDemoRoutes = async (): Promise<DemoRoutesJson> => {
  const routesModule = await import('@/lib/demo/demoRoutes.json');
  const routes = parseDemoRoutes(routesModule.default);
  if (!routes) throw new Error('Demo routes are invalid');
  return routes;
};

const saveDemoSessionData = async (dataset: DemoDataset): Promise<void> => {
  const gpsTracks: SessionGPS[] = [];
  for (const entry of dataset.sessionData) {
    const gps = buildSessionGPS({ sessionId: entry.sessionId, records: entry.records });
    if (gps) gpsTracks.push(gps);
    useImportProgressStore.getState().advanceImport();
  }

  useImportProgressStore.getState().markImportSaving();
  await Promise.all([bulkSaveSessionData(dataset.sessionData), ...gpsTracks.map(saveSessionGPS)]);
};

const addDemoSessions = (dataset: DemoDataset): void => {
  useSessionsStore.getState().addSessions({ sessions: dataset.sessions });
  // The builder scores every session with the profile it sets, so no records recompute follows.
  if (useSessionsStore.getState().sessions.length === dataset.sessions.length) {
    useSessionsStore
      .getState()
      .setAppliedHrSignature(trainingLoadHrSignature(useUserStore.getState().profile));
  }
};

const addDemoTripsAndRoutes = async ({
  dataset,
  queryClient,
}: {
  dataset: DemoDataset;
  queryClient: QueryClient;
}): Promise<void> => {
  for (const trip of dataset.trips) {
    const tripId = useTripsStore
      .getState()
      .createTrip({ name: trip.name, description: trip.description });
    useTripsStore.getState().updateTrip({
      id: tripId,
      name: trip.name,
      sessionIds: trip.sessionIds,
      description: trip.description,
    });
  }
  for (const route of dataset.studioRoutes) {
    await createStudioRouteFromPoints(
      { points: route.points, name: route.name, sourceFileName: route.sourceFileName },
      queryClient,
    );
  }
};

/** Builds the deterministic demo dataset and stores it like an import. */
export const loadDemoData = async (queryClient: QueryClient): Promise<number> => {
  useImportProgressStore.getState().beginImport('demo');
  const routes = await loadDemoRoutes();
  const dataset = buildDemoDataset({ seed: DEMO_SEED, today: new Date(), routes });

  useUserStore.getState().setProfile(dataset.profile);
  useImportProgressStore.getState().setImportTotal(dataset.sessions.length);
  await saveDemoSessionData(dataset);
  addDemoSessions(dataset);
  await addDemoTripsAndRoutes({ dataset, queryClient });

  void invalidatePersonalBests(queryClient);
  void invalidateSessionGps(queryClient);
  useImportProgressStore.getState().finishImport({
    kind: 'imported',
    imported: dataset.sessions.length,
    duplicated: 0,
    failed: 0,
  });

  return dataset.sessions.length;
};
