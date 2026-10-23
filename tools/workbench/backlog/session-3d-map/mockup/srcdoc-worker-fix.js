/* Board fix: inside a srcdoc iframe served over http, `location.origin` is "null", while the
   blob workers MapLibre spawns report the real origin (e.g. http://localhost:4321). MapLibre's
   Actor drops every message whose `data.origin` differs from its own `location.origin`
   (maplibre-gl 5.18.0, Actor.receive), so the style never finishes loading and the map stays
   black. Under file:// both sides are exempt, so the bug only shows on the board. This wrapper
   rewrites `origin` in both directions. Not needed in the app (a real page, not srcdoc). */
(() => {
  const own = location.origin;
  let workerOrigin = own;
  try {
    workerOrigin = new URL(URL.createObjectURL(new Blob([''])).slice(5)).origin;
  } catch (err) {
    workerOrigin = own;
  }
  if (own === workerOrigin) return;
  const Native = window.Worker;
  const fix = (data, from, to) => {
    if (data && typeof data === 'object' && data.origin === from) data.origin = to;
  };
  class PatchedWorker extends Native {
    postMessage(data, ...rest) {
      fix(data, own, workerOrigin);
      return super.postMessage(data, ...rest);
    }
    addEventListener(type, listener, ...rest) {
      if (type !== 'message' || typeof listener !== 'function') return super.addEventListener(type, listener, ...rest);
      return super.addEventListener(
        type,
        (e) => {
          fix(e.data, workerOrigin, own);
          listener(e);
        },
        ...rest,
      );
    }
  }
  window.Worker = PatchedWorker;
  window.PV_WORKER_ORIGIN_FIX = `${own} ↔ ${workerOrigin}`;
})();
