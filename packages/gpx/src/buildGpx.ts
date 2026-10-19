export interface GpxPoint {
  lat: number;
  lon: number;
  ele?: number;
  time?: Date;
  seg?: number;
}

export interface GpxWaypoint {
  lat: number;
  lon: number;
  ele?: number;
  name: string;
  desc?: string;
}

export interface GpxMetadata {
  name?: string;
  time: Date;
}

const escapeXml = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export const buildGpxString = (
  points: GpxPoint[],
  metadata: GpxMetadata,
  waypoints: GpxWaypoint[] = [],
): string | null => {
  if (points.length < 2) return null;

  const parts: string[] = [];
  parts.push('<?xml version="1.0" encoding="UTF-8"?>');
  parts.push(
    '<gpx version="1.1" creator="PaceVault"' +
      ' xmlns="http://www.topografix.com/GPX/1/1"' +
      ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
      ' xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">',
  );

  let escapedName: string | undefined;
  if (metadata?.name) {
    escapedName = escapeXml(metadata.name);
  }

  parts.push('<metadata>');
  if (escapedName) {
    parts.push(`<name>${escapedName}</name>`);
  }
  if (metadata.time) {
    parts.push(`<time>${metadata.time.toISOString()}</time>`);
  }
  parts.push('</metadata>');

  for (const w of waypoints) {
    parts.push(`<wpt lat="${w.lat.toFixed(6)}" lon="${w.lon.toFixed(6)}">`);
    if (w.ele != null) {
      parts.push(`<ele>${w.ele.toFixed(1)}</ele>`);
    }
    parts.push(`<name>${escapeXml(w.name)}</name>`);
    if (w.desc) {
      parts.push(`<desc>${escapeXml(w.desc)}</desc>`);
    }
    parts.push('</wpt>');
  }

  parts.push('<trk>');
  if (escapedName) {
    parts.push(`<name>${escapedName}</name>`);
  }
  parts.push('<trkseg>');

  let currentSeg = points[0]?.seg;
  for (const p of points) {
    if (p.seg !== currentSeg) {
      parts.push('</trkseg>');
      parts.push('<trkseg>');
      currentSeg = p.seg;
    }
    const lat = p.lat.toFixed(6);
    const lon = p.lon.toFixed(6);
    parts.push(`<trkpt lat="${lat}" lon="${lon}">`);
    if (p.ele != null) {
      parts.push(`<ele>${p.ele.toFixed(1)}</ele>`);
    }
    if (p.time) {
      parts.push(`<time>${p.time.toISOString()}</time>`);
    }
    parts.push('</trkpt>');
  }

  parts.push('</trkseg>');
  parts.push('</trk>');
  parts.push('</gpx>');

  return parts.join('\n');
};

export const buildGpxFilename = (sport: string, dateMs: number): string => {
  const date = new Date(dateMs).toISOString().slice(0, 10);
  const sportLabel = sport.charAt(0).toUpperCase() + sport.slice(1);
  return `PaceVault_${sportLabel}_${date}.gpx`;
};
