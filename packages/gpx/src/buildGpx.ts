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

const COORDINATE_DECIMALS = 6;
const ELEVATION_DECIMALS = 1;

const escapeXml = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const metadataLines = ({
  escapedName,
  time,
}: {
  escapedName: string | undefined;
  time: Date;
}): string[] => {
  const lines = ['<metadata>'];
  if (escapedName) lines.push(`<name>${escapedName}</name>`);
  lines.push(`<time>${time.toISOString()}</time>`);
  lines.push('</metadata>');
  return lines;
};

const waypointLines = (waypoint: GpxWaypoint): string[] => {
  const lines = [
    `<wpt lat="${waypoint.lat.toFixed(COORDINATE_DECIMALS)}" lon="${waypoint.lon.toFixed(COORDINATE_DECIMALS)}">`,
  ];
  if (waypoint.ele != null) lines.push(`<ele>${waypoint.ele.toFixed(ELEVATION_DECIMALS)}</ele>`);
  lines.push(`<name>${escapeXml(waypoint.name)}</name>`);
  if (waypoint.desc) lines.push(`<desc>${escapeXml(waypoint.desc)}</desc>`);
  lines.push('</wpt>');
  return lines;
};

const trackPointLines = (point: GpxPoint): string[] => {
  const lines = [
    `<trkpt lat="${point.lat.toFixed(COORDINATE_DECIMALS)}" lon="${point.lon.toFixed(COORDINATE_DECIMALS)}">`,
  ];
  if (point.ele != null) lines.push(`<ele>${point.ele.toFixed(ELEVATION_DECIMALS)}</ele>`);
  if (point.time) lines.push(`<time>${point.time.toISOString()}</time>`);
  lines.push('</trkpt>');
  return lines;
};

const trackLines = ({
  points,
  escapedName,
}: {
  points: GpxPoint[];
  escapedName: string | undefined;
}): string[] => {
  const lines = ['<trk>'];
  if (escapedName) lines.push(`<name>${escapedName}</name>`);
  lines.push('<trkseg>');
  let currentSegment = points[0]?.seg;
  for (const point of points) {
    if (point.seg !== currentSegment) {
      lines.push('</trkseg>', '<trkseg>');
      currentSegment = point.seg;
    }
    lines.push(...trackPointLines(point));
  }
  lines.push('</trkseg>', '</trk>');
  return lines;
};

export const buildGpxString = ({
  points,
  metadata,
  waypoints = [],
}: {
  points: GpxPoint[];
  metadata: GpxMetadata;
  waypoints?: GpxWaypoint[];
}): string | null => {
  if (points.length < 2) return null;

  let escapedName: string | undefined;
  if (metadata.name) escapedName = escapeXml(metadata.name);

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<gpx version="1.1" creator="PaceVault"' +
      ' xmlns="http://www.topografix.com/GPX/1/1"' +
      ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
      ' xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">',
    ...metadataLines({ escapedName, time: metadata.time }),
    ...waypoints.flatMap((waypoint) => waypointLines(waypoint)),
    ...trackLines({ points, escapedName }),
    '</gpx>',
  ].join('\n');
};
