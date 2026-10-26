import { z } from 'zod';

interface ParsedGpx {
  name?: string;
  points: ParsedGpxPoint[];
}

const parsedGpxPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  ele: z.number().optional(),
  time: z.number().optional(),
  seg: z.number(),
});

export type ParsedGpxPoint = z.infer<typeof parsedGpxPointSchema>;

const parseElevation = (element: Element): number | undefined => {
  const elevationElement = element.getElementsByTagNameNS('*', 'ele')[0];
  if (!elevationElement?.textContent) return undefined;
  const value = Number(elevationElement.textContent.trim());
  if (Number.isNaN(value)) return undefined;
  return value;
};

const parseTimeMs = (element: Element): number | undefined => {
  const timeElement = element.getElementsByTagNameNS('*', 'time')[0];
  if (!timeElement?.textContent) return undefined;
  const value = Date.parse(timeElement.textContent.trim());
  if (Number.isNaN(value)) return undefined;
  return value;
};

const parseCoordinateAttribute = ({
  element,
  attribute,
}: {
  element: Element;
  attribute: string;
}): number | undefined => {
  const attributeText = element.getAttribute(attribute);
  if (attributeText === null || attributeText.trim() === '') return undefined;
  const value = Number(attributeText);
  if (Number.isNaN(value)) return undefined;
  return value;
};

const parsePoint = ({
  element,
  segmentIndex,
}: {
  element: Element;
  segmentIndex: number;
}): ParsedGpxPoint | null => {
  const parsedPoint = parsedGpxPointSchema.safeParse({
    lat: parseCoordinateAttribute({ element, attribute: 'lat' }),
    lng: parseCoordinateAttribute({ element, attribute: 'lon' }),
    ele: parseElevation(element),
    time: parseTimeMs(element),
    seg: segmentIndex,
  });
  if (!parsedPoint.success) return null;
  return parsedPoint.data;
};

const collectPoints = ({
  containers,
  pointTag,
}: {
  containers: ArrayLike<Element>;
  pointTag: 'trkpt' | 'rtept';
}): ParsedGpxPoint[] => {
  const points: ParsedGpxPoint[] = [];
  for (let segmentIndex = 0; segmentIndex < containers.length; segmentIndex++) {
    const container = containers[segmentIndex];
    if (!container) continue;
    const pointElements = container.getElementsByTagNameNS('*', pointTag);
    for (let i = 0; i < pointElements.length; i++) {
      const element = pointElements[i];
      if (!element) continue;
      const point = parsePoint({ element, segmentIndex });
      if (point) points.push(point);
    }
  }
  return points;
};

const parseName = (gpxDocument: Document): string | undefined => {
  const nameElement = gpxDocument.getElementsByTagNameNS('*', 'name')[0];
  const name = nameElement?.textContent?.trim();
  if (!name) return undefined;
  return name;
};

export const parseGpx = (gpxText: string): ParsedGpx | null => {
  const gpxDocument = new DOMParser().parseFromString(gpxText, 'application/xml');
  if (gpxDocument.getElementsByTagName('parsererror').length > 0) return null;
  if (gpxDocument.documentElement.localName !== 'gpx') return null;

  let points = collectPoints({
    containers: gpxDocument.getElementsByTagNameNS('*', 'trkseg'),
    pointTag: 'trkpt',
  });
  if (points.length === 0) {
    points = collectPoints({
      containers: gpxDocument.getElementsByTagNameNS('*', 'rte'),
      pointTag: 'rtept',
    });
  }
  if (points.length < 2) return null;

  return { name: parseName(gpxDocument), points };
};
