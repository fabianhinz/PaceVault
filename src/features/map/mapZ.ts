/**
 * z-index layering *inside* the map.
 *
 * The MapBackground root is `z-0` in the app shell (with `position: fixed`, so
 * it forms its own stacking context — everything below is scoped to the map and
 * can never cover app content at `z-10` or popups at `z-50`).
 *
 * Within that context deck.gl paints the track/route on an overlaid canvas at
 * the browser default (`z-index: auto`), so any positive z lifts DOM markers
 * (react-map-gl `<Marker>`) above it — which is what makes the pins' glass
 * backdrop blur the track instead of the track painting over the pins.
 */
export const MAP_MARKER_Z = 'z-10';
