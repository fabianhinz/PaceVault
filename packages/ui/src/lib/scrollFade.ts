const EDGE_TOLERANCE = 1;

interface ScrollMetrics {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}

export const scrollFadeEdges = (metrics: ScrollMetrics): { top: boolean; bottom: boolean } => {
  const hiddenBelow = metrics.scrollHeight - metrics.clientHeight - metrics.scrollTop;
  return {
    top: metrics.scrollTop > EDGE_TOLERANCE,
    bottom: hiddenBelow > EDGE_TOLERANCE,
  };
};

interface HorizontalScrollMetrics {
  scrollLeft: number;
  scrollWidth: number;
  clientWidth: number;
}

export const horizontalScrollFadeEdges = (
  metrics: HorizontalScrollMetrics,
): { left: boolean; right: boolean } => {
  const hiddenRight = metrics.scrollWidth - metrics.clientWidth - metrics.scrollLeft;
  return {
    left: metrics.scrollLeft > EDGE_TOLERANCE,
    right: hiddenRight > EDGE_TOLERANCE,
  };
};
