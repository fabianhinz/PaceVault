import { describe, it, expect } from 'vitest';
import { intervalsAthleteSchema, parseActivityList } from '@/lib/intervals/intervalsSchemas.ts';

describe('intervalsAthleteSchema', () => {
  it('drops the api key and the e-mail address from the athlete payload', () => {
    const raw = {
      id: 'i365697',
      firstname: 'Fabian',
      lastname: 'Hinz',
      icu_athlete_id: 'i365697',
      icu_api_key: 'super-secret-key',
      email: 'someone@example.com',
      weight: 76,
      icu_resting_hr: 48,
    };

    const parsed = intervalsAthleteSchema.parse(raw);

    expect(parsed).toEqual({ firstname: 'Fabian', icu_athlete_id: 'i365697' });
    expect(Object.keys(parsed)).toEqual(['firstname', 'icu_athlete_id']);
    expect(JSON.stringify(parsed)).not.toContain('super-secret-key');
    expect(JSON.stringify(parsed)).not.toContain('example.com');
  });

  it('tolerates a payload missing both fields', () => {
    expect(intervalsAthleteSchema.safeParse({}).success).toBe(true);
  });
});

describe('parseActivityList', () => {
  it('reduces a wide activity to the fields we asked for', () => {
    const raw = [
      {
        id: 'i178993058',
        name: 'Z2',
        type: 'Ride',
        sub_type: null,
        start_date_local: '2026-08-23T17:05:02',
        source: 'GARMIN_CONNECT',
        file_type: 'fit',
        moving_time: 10880,
        distance: 78018.05,
        icu_training_load: 130,
        external_id: 'someone@example.com_472408026511.fit',
        skyline_chart_bytes: 'CAcSIPMBtgG',
        icu_hr_zones: [143, 160, 167],
      },
    ];

    const result = parseActivityList(raw);

    expect(result.dropped).toBe(0);
    expect(result.activities).toHaveLength(1);
    expect(result.activities[0]).not.toHaveProperty('external_id');
    expect(result.activities[0]).not.toHaveProperty('skyline_chart_bytes');
    expect(JSON.stringify(result.activities)).not.toContain('example.com');
  });

  it('drops a malformed row without voiding the rest of the listing', () => {
    const result = parseActivityList([{ id: 'i1' }, { name: 'no id here' }, { id: 'i2' }]);

    expect(result.activities.map((a) => a.id)).toEqual(['i1', 'i2']);
    expect(result.dropped).toBe(1);
  });

  it('returns a safe fallback for a non-array payload', () => {
    expect(parseActivityList({ error: 'nope' })).toEqual({ activities: [], dropped: 0 });
    expect(parseActivityList(null)).toEqual({ activities: [], dropped: 0 });
  });

  it('keeps a Strava stub so it can be reported as unavailable', () => {
    const result = parseActivityList([
      { id: 'i1', source: 'STRAVA', name: null, type: null, _note: 'not available' },
    ]);

    expect(result.dropped).toBe(0);
    expect(result.activities[0]?._note).toBe('not available');
  });
});
