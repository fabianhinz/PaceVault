export interface HighlightTrack {
  count: number;
  padding: number;
  gap: number;
  itemSize: number | 'share';
}

export interface TrackLength {
  px: number;
  percent: number;
}

interface HighlightRect {
  offset: TrackLength;
  size: TrackLength;
}

const itemLength = (track: HighlightTrack): TrackLength => {
  if (track.itemSize === 'share') {
    return {
      px: -(2 * track.padding + (track.count - 1) * track.gap) / track.count,
      percent: 100 / track.count,
    };
  }
  return { px: track.itemSize, percent: 0 };
};

export const highlightRect = (track: HighlightTrack, index: number): HighlightRect => {
  const size = itemLength(track);
  return {
    offset: {
      px: track.padding + index * (size.px + track.gap),
      percent: index * size.percent,
    },
    size,
  };
};

export const trackLengthCss = (length: TrackLength): string =>
  `calc(${length.px}px + ${length.percent}%)`;
