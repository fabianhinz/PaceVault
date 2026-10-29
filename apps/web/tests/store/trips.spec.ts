import { describe, it, expect, beforeEach } from 'vite-plus/test';
import { INITIAL_TRIPS_STORE_STATE, useTripsStore } from '@/store/trips.ts';

describe('useTripsStore', () => {
  beforeEach(() => {
    useTripsStore.setState(INITIAL_TRIPS_STORE_STATE);
  });

  it('creates a trip with a generated id, empty sessions and createdAt', () => {
    const id = useTripsStore
      .getState()
      .createTrip({ name: 'Alps 2026', description: 'Summer tour' });
    const trips = useTripsStore.getState().trips;
    expect(trips).toHaveLength(1);
    expect(trips[0].id).toBe(id);
    expect(trips[0].name).toBe('Alps 2026');
    expect(trips[0].description).toBe('Summer tour');
    expect(trips[0].sessionIds).toEqual([]);
    expect(typeof trips[0].createdAt).toBe('number');
  });

  it('assigns a session to a trip', () => {
    const id = useTripsStore.getState().createTrip({ name: 'Trip A' });
    useTripsStore.getState().assignSession({ sessionId: 's1', tripId: id });
    expect(useTripsStore.getState().trips[0].sessionIds).toEqual(['s1']);
  });

  it('moves a session between trips (single membership)', () => {
    const a = useTripsStore.getState().createTrip({ name: 'Trip A' });
    const b = useTripsStore.getState().createTrip({ name: 'Trip B' });
    useTripsStore.getState().assignSession({ sessionId: 's1', tripId: a });
    useTripsStore.getState().assignSession({ sessionId: 's1', tripId: b });
    const trips = useTripsStore.getState().trips;
    expect(trips.find((t) => t.id === a)?.sessionIds).toEqual([]);
    expect(trips.find((t) => t.id === b)?.sessionIds).toEqual(['s1']);
  });

  it('does not duplicate a session when assigned to the same trip twice', () => {
    const a = useTripsStore.getState().createTrip({ name: 'Trip A' });
    useTripsStore.getState().assignSession({ sessionId: 's1', tripId: a });
    useTripsStore.getState().assignSession({ sessionId: 's1', tripId: a });
    expect(useTripsStore.getState().trips[0].sessionIds).toEqual(['s1']);
  });

  it('removes a session from a specific trip', () => {
    const a = useTripsStore.getState().createTrip({ name: 'Trip A' });
    useTripsStore.getState().assignSession({ sessionId: 's1', tripId: a });
    useTripsStore.getState().removeSessionFromTrip({ sessionId: 's1', tripId: a });
    expect(useTripsStore.getState().trips[0].sessionIds).toEqual([]);
  });

  it('removes a session from all trips (cascade cleanup)', () => {
    const a = useTripsStore.getState().createTrip({ name: 'Trip A' });
    const b = useTripsStore.getState().createTrip({ name: 'Trip B' });
    useTripsStore.getState().assignSession({ sessionId: 's1', tripId: a });
    useTripsStore.getState().assignSession({ sessionId: 's2', tripId: b });
    useTripsStore.getState().removeSessionFromAllTrips('s1');
    const trips = useTripsStore.getState().trips;
    expect(trips.find((t) => t.id === a)?.sessionIds).toEqual([]);
    expect(trips.find((t) => t.id === b)?.sessionIds).toEqual(['s2']);
  });

  it('updates a trip name and session set, enforcing single membership', () => {
    const a = useTripsStore.getState().createTrip({ name: 'Trip A' });
    const b = useTripsStore.getState().createTrip({ name: 'Trip B' });
    useTripsStore.getState().assignSession({ sessionId: 's1', tripId: a });
    useTripsStore.getState().assignSession({ sessionId: 's2', tripId: b });

    // Rename B and give it s1 and s3; s1 must leave A (single membership).
    useTripsStore
      .getState()
      .updateTrip({ id: b, name: 'Trip B renamed', sessionIds: ['s1', 's3'] });

    const trips = useTripsStore.getState().trips;
    const tripA = trips.find((t) => t.id === a);
    const tripB = trips.find((t) => t.id === b);
    expect(tripB?.name).toBe('Trip B renamed');
    expect(tripB?.sessionIds).toEqual(['s1', 's3']);
    expect(tripA?.sessionIds).toEqual([]);
  });

  it('updates a trip description (and clears it when omitted)', () => {
    const a = useTripsStore.getState().createTrip({ name: 'Trip A', description: 'Original' });
    useTripsStore
      .getState()
      .updateTrip({ id: a, name: 'Trip A', sessionIds: ['s1'], description: 'Updated' });
    expect(useTripsStore.getState().trips[0].description).toBe('Updated');
    useTripsStore.getState().updateTrip({ id: a, name: 'Trip A', sessionIds: ['s1'] });
    expect(useTripsStore.getState().trips[0].description).toBeUndefined();
  });

  it('deletes a trip', () => {
    const a = useTripsStore.getState().createTrip({ name: 'Trip A' });
    useTripsStore.getState().createTrip({ name: 'Trip B' });
    useTripsStore.getState().deleteTrip(a);
    const trips = useTripsStore.getState().trips;
    expect(trips).toHaveLength(1);
    expect(trips.find((t) => t.id === a)).toBeUndefined();
  });

  it('clears all trips', () => {
    useTripsStore.getState().createTrip({ name: 'Trip A' });
    useTripsStore.getState().createTrip({ name: 'Trip B' });
    useTripsStore.getState().clearAll();
    expect(useTripsStore.getState().trips).toEqual([]);
  });

  it('is persisted under the store-trips key at version 1', () => {
    const options = useTripsStore.persist.getOptions();
    expect(options.name).toBe('store-trips');
    expect(options.version).toBe(1);
  });
});
