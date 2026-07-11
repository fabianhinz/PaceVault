import { z } from 'zod';

export interface ParsedGpxPoint {
  lat: number;
  lng: number;
  ele?: number;
  /** Index of the containing trkseg (or rte), preserved for future segment-aware editing. */
  seg: number;
}

export interface ParsedGpx {
  name?: string;
  points: ParsedGpxPoint[];
}

const pointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  ele: z.number().optional(),
});

const parseElevation = (el: Element): number | undefined => {
  const eleEl = el.getElementsByTagNameNS('*', 'ele')[0];
  if (!eleEl?.textContent) return undefined;
  const value = Number(eleEl.textContent.trim());
  if (Number.isNaN(value)) return undefined;
  return value;
};

const parseCoordAttribute = (el: Element, attribute: string): number | undefined => {
  const raw = el.getAttribute(attribute);
  if (raw === null || raw.trim() === '') return undefined;
  const value = Number(raw);
  if (Number.isNaN(value)) return undefined;
  return value;
};

const parsePoint = (el: Element, seg: number): ParsedGpxPoint | null => {
  const result = pointSchema.safeParse({
    lat: parseCoordAttribute(el, 'lat'),
    lng: parseCoordAttribute(el, 'lon'),
    ele: parseElevation(el),
  });
  if (!result.success) return null;
  return { ...result.data, seg };
};

const collectPoints = (
  containers: ArrayLike<Element>,
  pointTag: 'trkpt' | 'rtept',
): ParsedGpxPoint[] => {
  const points: ParsedGpxPoint[] = [];
  for (let seg = 0; seg < containers.length; seg++) {
    const container = containers[seg];
    if (!container) continue;
    const pointEls = container.getElementsByTagNameNS('*', pointTag);
    for (let i = 0; i < pointEls.length; i++) {
      const el = pointEls[i];
      if (!el) continue;
      const point = parsePoint(el, seg);
      if (point) points.push(point);
    }
  }
  return points;
};

const parseName = (doc: Document): string | undefined => {
  const nameEl = doc.getElementsByTagNameNS('*', 'name')[0];
  const name = nameEl?.textContent?.trim();
  if (!name) return undefined;
  return name;
};

/**
 * Parse a GPX 1.0/1.1 document into a flat list of route points.
 * Track points (`trkpt`) win over route points (`rtept`); multiple
 * `trkseg`/`rte` containers are concatenated with an increasing `seg` index.
 * Returns `null` when the XML is invalid or fewer than 2 valid points exist.
 */
export const parseGpx = (gpxText: string): ParsedGpx | null => {
  const doc = new DOMParser().parseFromString(gpxText, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length > 0) return null;
  if (doc.documentElement.localName !== 'gpx') return null;

  let points = collectPoints(doc.getElementsByTagNameNS('*', 'trkseg'), 'trkpt');
  if (points.length === 0) {
    points = collectPoints(doc.getElementsByTagNameNS('*', 'rte'), 'rtept');
  }
  if (points.length < 2) return null;

  return { name: parseName(doc), points };
};
