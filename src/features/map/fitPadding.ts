export interface MapPadding {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export const MIN_FIT_BOX = 120;
export const PHONE_FIT_MARGIN = 24;

interface FitPaddingInput {
  canvasHeight: number;
  insets: MapPadding;
  margin: number;
}

export const fitPadding = (input: FitPaddingInput): MapPadding => {
  const top = input.insets.top + input.margin;
  const maxBottom = Math.max(0, input.canvasHeight - top - MIN_FIT_BOX);
  return {
    top,
    bottom: Math.min(input.insets.bottom + input.margin, maxBottom),
    left: input.insets.left + input.margin,
    right: input.insets.right + input.margin,
  };
};
