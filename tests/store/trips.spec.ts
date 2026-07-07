import { describe, it, expect, beforeEach } from 'vitest';
import { useTripsStore } from '@/store/trips.ts';

describe('useTripsStore', () => {
  beforeEach(() => {
    useTripsStore.setState({ trips: [] });
  });

  it('creates a trip with a generated id, empty sessions and createdAt', () => {
    const id = useTripsStore.getState().createTrip('Alps 2026', 'Summer tour');
    const trips = useTripsStore.getState().trips;
    expect(trips).toHaveLength(1);
    expect(trips[0].id).toBe(id);
    expect(trips[0].name).toBe('Alps 2026');
    expect(trips[0].description).toBe('Summer tour');
    expect(trips[0].sessionIds).toEqual([]);
    expect(typeof trips[0].createdAt).toBe('number');
  });

  it('assigns a session to a trip', () => {
    const id = useTripsStore.getState().createTrip('Trip A');
    useTripsStore.getState().assignSession('s1', id);
    expect(useTripsStore.getState().trips[0].sessionIds).toEqual(['s1']);
  });

  it('moves a session between trips (single membership)', () => {
    const a = useTripsStore.getState().createTrip('Trip A');
    const b = useTripsStore.getState().createTrip('Trip B');
    useTripsStore.getState().assignSession('s1', a);
    useTripsStore.getState().assignSession('s1', b);
    const trips = useTripsStore.getState().trips;
    expect(trips.find((t) => t.id === a)?.sessionIds).toEqual([]);
    expect(trips.find((t) => t.id === b)?.sessionIds).toEqual(['s1']);
  });

  it('does not duplicate a session when assigned to the same trip twice', () => {
    const a = useTripsStore.getState().createTrip('Trip A');
    useTripsStore.getState().assignSession('s1', a);
    useTripsStore.getState().assignSession('s1', a);
    expect(useTripsStore.getState().trips[0].sessionIds).toEqual(['s1']);
  });

  it('removes a session from a specific trip', () => {
    const a = useTripsStore.getState().createTrip('Trip A');
    useTripsStore.getState().assignSession('s1', a);
    useTripsStore.getState().removeSessionFromTrip('s1', a);
    expect(useTripsStore.getState().trips[0].sessionIds).toEqual([]);
  });

  it('removes a session from all trips (cascade cleanup)', () => {
    const a = useTripsStore.getState().createTrip('Trip A');
    const b = useTripsStore.getState().createTrip('Trip B');
    useTripsStore.getState().assignSession('s1', a);
    useTripsStore.getState().assignSession('s2', b);
    useTripsStore.getState().removeSessionFromAllTrips('s1');
    const trips = useTripsStore.getState().trips;
    expect(trips.find((t) => t.id === a)?.sessionIds).toEqual([]);
    expect(trips.find((t) => t.id === b)?.sessionIds).toEqual(['s2']);
  });

  it('updates a trip name and session set, enforcing single membership', () => {
    const a = useTripsStore.getState().createTrip('Trip A');
    const b = useTripsStore.getState().createTrip('Trip B');
    useTripsStore.getState().assignSession('s1', a);
    useTripsStore.getState().assignSession('s2', b);

    // Rename B and give it s1 and s3; s1 must leave A (single membership).
    useTripsStore.getState().updateTrip(b, 'Trip B renamed', ['s1', 's3']);

    const trips = useTripsStore.getState().trips;
    const tripA = trips.find((t) => t.id === a);
    const tripB = trips.find((t) => t.id === b);
    expect(tripB?.name).toBe('Trip B renamed');
    expect(tripB?.sessionIds).toEqual(['s1', 's3']);
    expect(tripA?.sessionIds).toEqual([]);
  });

  it('deletes a trip', () => {
    const a = useTripsStore.getState().createTrip('Trip A');
    useTripsStore.getState().createTrip('Trip B');
    useTripsStore.getState().deleteTrip(a);
    const trips = useTripsStore.getState().trips;
    expect(trips).toHaveLength(1);
    expect(trips.find((t) => t.id === a)).toBeUndefined();
  });

  it('clears all trips', () => {
    useTripsStore.getState().createTrip('Trip A');
    useTripsStore.getState().createTrip('Trip B');
    useTripsStore.getState().clearAll();
    expect(useTripsStore.getState().trips).toEqual([]);
  });

  it('is persisted under the store-trips key at version 1', () => {
    const options = useTripsStore.persist.getOptions();
    expect(options.name).toBe('store-trips');
    expect(options.version).toBe(1);
  });
});
