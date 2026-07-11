import { describe, it, expect } from 'vitest';
import { parseGpx } from '@/packages/gpx/parseGpx.ts';

const gpx = (body: string): string =>
  `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="test" xmlns="http://www.topografix.com/GPX/1/1">${body}</gpx>`;

const trkpt = (lat: number, lon: number, ele?: number): string => {
  if (ele != null) {
    return `<trkpt lat="${lat}" lon="${lon}"><ele>${ele}</ele></trkpt>`;
  }
  return `<trkpt lat="${lat}" lon="${lon}"/>`;
};

describe('parseGpx', () => {
  it('parses track points with elevation and name', () => {
    const result = parseGpx(
      gpx(
        `<metadata><name>Morning Ride</name></metadata>
         <trk><trkseg>${trkpt(47.1, 11.2, 800)}${trkpt(47.2, 11.3, 820.5)}</trkseg></trk>`,
      ),
    );
    expect(result).not.toBeNull();
    expect(result?.name).toBe('Morning Ride');
    expect(result?.points).toEqual([
      { lat: 47.1, lng: 11.2, ele: 800, seg: 0 },
      { lat: 47.2, lng: 11.3, ele: 820.5, seg: 0 },
    ]);
  });

  it('parses points without elevation', () => {
    const result = parseGpx(
      gpx(`<trk><trkseg>${trkpt(47.1, 11.2)}${trkpt(47.2, 11.3)}</trkseg></trk>`),
    );
    expect(result?.points[0]?.ele).toBeUndefined();
  });

  it('concatenates multiple track segments with increasing seg index', () => {
    const result = parseGpx(
      gpx(
        `<trk><trkseg>${trkpt(47.1, 11.2)}</trkseg><trkseg>${trkpt(47.2, 11.3)}</trkseg></trk>
         <trk><trkseg>${trkpt(47.3, 11.4)}</trkseg></trk>`,
      ),
    );
    expect(result?.points.map((p) => p.seg)).toEqual([0, 1, 2]);
  });

  it('falls back to route points when no track points exist', () => {
    const result = parseGpx(
      gpx(`<rte><rtept lat="47.1" lon="11.2"/><rtept lat="47.2" lon="11.3"/></rte>`),
    );
    expect(result?.points).toHaveLength(2);
    expect(result?.points[0]?.lat).toBe(47.1);
  });

  it('prefers track points over route points', () => {
    const result = parseGpx(
      gpx(
        `<rte><rtept lat="1" lon="1"/><rtept lat="2" lon="2"/></rte>
         <trk><trkseg>${trkpt(47.1, 11.2)}${trkpt(47.2, 11.3)}</trkseg></trk>`,
      ),
    );
    expect(result?.points.map((p) => p.lat)).toEqual([47.1, 47.2]);
  });

  it('filters points with out-of-range or missing coordinates', () => {
    const result = parseGpx(
      gpx(
        `<trk><trkseg>
          ${trkpt(47.1, 11.2)}
          <trkpt lat="91" lon="11.2"/>
          <trkpt lat="47.1" lon="181"/>
          <trkpt lon="11.2"/>
          <trkpt lat="abc" lon="11.2"/>
          ${trkpt(47.2, 11.3)}
        </trkseg></trk>`,
      ),
    );
    expect(result?.points).toHaveLength(2);
  });

  it('ignores non-numeric elevation but keeps the point', () => {
    const result = parseGpx(
      gpx(
        `<trk><trkseg><trkpt lat="47.1" lon="11.2"><ele>n/a</ele></trkpt>${trkpt(47.2, 11.3)}</trkseg></trk>`,
      ),
    );
    expect(result?.points[0]).toEqual({ lat: 47.1, lng: 11.2, seg: 0 });
  });

  it('returns undefined name when no name element exists', () => {
    const result = parseGpx(
      gpx(`<trk><trkseg>${trkpt(47.1, 11.2)}${trkpt(47.2, 11.3)}</trkseg></trk>`),
    );
    expect(result?.name).toBeUndefined();
  });

  it('returns null for fewer than 2 valid points', () => {
    expect(parseGpx(gpx(`<trk><trkseg>${trkpt(47.1, 11.2)}</trkseg></trk>`))).toBeNull();
    expect(parseGpx(gpx('<trk><trkseg></trkseg></trk>'))).toBeNull();
  });

  it('returns null for malformed XML', () => {
    expect(parseGpx('<gpx><trk>')).toBeNull();
    expect(parseGpx('not xml at all')).toBeNull();
  });

  it('returns null for XML that is not a gpx document', () => {
    expect(parseGpx('<html><body>hi</body></html>')).toBeNull();
  });
});
