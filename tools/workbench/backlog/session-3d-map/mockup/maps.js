/* Map stack of variant D with the real libraries: maplibre-gl 5.18.0 with the vendored dark-matter
   style; deck.gl 9.2.9 MapboxOverlay draws the 2D session map exactly as today
   (apps/web/src/features/map/DeckGLOverlay.tsx:116-141,202-274,352-371). Only while 3D is on (Q15):
   Mapterhorn raster-dem at true scale (Q5) + hillshade black/white (Q11), track min 3 px (Q12).
   In 3D only, the session track, its laps and the hover dot are MapLibre line/circle layers (per-
   segment features, draped); deck.gl then draws nothing session-related. Two code paths (Q34). */
(() => {
  const PV = window.PV;
  const M = (PV.maps = {});
  const TILE_URL = 'https://tiles-a.basemaps.cartocdn.com/vectortiles/carto.streets/v1/{z}/{x}/{y}.mvt';
  const GLYPHS_URL = 'https://tiles.basemaps.cartocdn.com/fonts/{fontstack}/{range}.pbf';
  const SPRITE_URL = 'https://tiles.basemaps.cartocdn.com/gl/dark-matter-gl-style/sprite';
  const ATTRIBUTION =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
  const DEM_URL = 'https://tiles.mapterhorn.com/{z}/{x}/{y}.webp';
  const DEM_OFFLINE_URL = 'https://tiles.mapterhorn.invalid/{z}/{x}/{y}.webp'; // scenario "Offline": every DEM tile fails
  const DEM_ATTRIBUTION = '<a href="https://mapterhorn.com/attribution/">&copy; Mapterhorn</a>';
  const TERRAIN_EXAGGERATION = 1; // Q5 (b): true scale
  const HILLSHADE = {
    // Q11 (a): black shadow, white highlight at low opacity
    'hillshade-shadow-color': '#000000',
    'hillshade-highlight-color': 'rgba(255,255,255,0.10)',
    'hillshade-accent-color': '#000000',
    'hillshade-exaggeration': 0.6,
  };
  const MIN_PX_3D = 3; // Q12 (a)
  const PICK_RADIUS = 25; // hooks/types.ts PICK_RADIUS (DeckGLOverlay.tsx:420,435)
  const DIMMED_BRIGHTNESS = 0.8; // DeckGLOverlay.tsx:51
  const LAP_CASING_SCALE = 1.6; // DeckGLOverlay.tsx:54
  const LAP_MAX_ZOOM = 16; // useMapCameraEffect.ts:26
  // "Max tilt" extra: 60 = MapLibre's default maxPitch; 85 is accepted, above 60 is "experimental" (tech.md §1a)
  const MAX_PITCH_3D = 60; // Q33: MapLibre's default, non-experimental maximum
  const ENTRY_TILT = 30; // Q37
  const LAP_FIT_MS = 800; // useMapCameraEffect.ts:65
  const SESSION_FIT_MS = 1200; // useMapCameraEffect.ts:68
  const MAX_PITCH_FLAT = 60;
  const MIN_ZOOM_BELOW_FIT = 2; // Q18: minZoom = fitted session zoom − 2

  let map;
  let overlay;
  let mapReady = false;
  let cameraKey = '';
  let terrainKey = '';
  let trackKey = '';
  let lapKey = '';
  let fittedZoom = null;
  let fitToken = 0;
  let fitEndCb = null;
  let hoveringTrack = false;
  let shownSel = -1;
  let shownHov = -1;

  const interleaved = PV.device === 'phone'; // MapBackground.tsx:94: overlaid on fine pointers, interleaved on touch
  const flatColors = () => {
    if (PV.lap.selected === null) return PV.colors;
    return PV.colors.map((c) => [Math.round(c[0] * DIMMED_BRIGHTNESS), Math.round(c[1] * DIMMED_BRIGHTNESS), Math.round(c[2] * DIMMED_BRIGHTNESS), c[3]]);
  };
  const lapSpan = (i) => (i === null || i === undefined ? null : PV.session.lapSpans[i]);

  M.init = () => {
    const base = window.PV_DARK_MATTER;
    // mapStyle.ts:25-50 — vendored style, CARTO source, sprite and glyphs, no API key
    const style = {
      ...base,
      sources: {
        ...base.sources,
        carto: { type: 'vector', tiles: [TILE_URL], minzoom: 0, maxzoom: 14, attribution: ATTRIBUTION },
      },
      sprite: SPRITE_URL,
      glyphs: GLYPHS_URL,
    };
    const fail = (reason) => {
      const el = document.querySelector('#mapError');
      el.hidden = false;
      el.querySelector('.t-caption').textContent = PV.t(`Map did not load: ${reason}`, `Karte nicht geladen: ${reason}`);
    };
    let lastError = 'timeout after 20 s';
    setTimeout(() => {
      if (!mapReady) fail(lastError);
    }, 20000);
    try {
      map = new maplibregl.Map({
        container: 'map',
        style,
        center: [10, 50],
        zoom: 4,
        maxZoom: 20,
        // 2D = today's flags (MapBackground.tsx:86-88): no drag rotate, no touch pitch, box zoom and
        // double-click zoom on. pitchWithRotate only matters while dragRotate is on, i.e. in 3D (Q17)
        dragRotate: false,
        pitchWithRotate: true,
        touchPitch: false,
        attributionControl: { compact: true },
      });
    } catch (err) {
      fail(String(err && err.message ? err.message : err));
      return;
    }
    map.on('error', (e) => {
      lastError = String((e && e.error && e.error.message) || 'map error');
    });
    map.getCanvas().addEventListener('webglcontextlost', () => fail('WebGL context lost'));
    overlay = new deck.MapboxOverlay({ interleaved, pickingRadius: PICK_RADIUS, layers: [] });
    map.addControl(overlay);
    // 3D (Q40, parity with 2D): hover and click pick the draped track with a 25 px box
    map.on('mousemove', (e) => {
      if (!PV.is3d(PV.state)) return; // 2D: deck picking and getCursor, as today
      const lap = lapAtPoint(e.point);
      map.getCanvas().style.cursor = lap === undefined ? '' : 'pointer';
      if (PV.device === 'desktop') PV.hoverLap(lap === undefined ? null : lap); // lap hover on fine pointers only
    });
    map.on('mouseout', () => {
      if (!PV.is3d(PV.state)) return;
      map.getCanvas().style.cursor = '';
      PV.hoverLap(null);
    });
    map.on('click', (e) => {
      if (!PV.is3d(PV.state) || PV.state.scenario === 'loading') return;
      const lap = lapAtPoint(e.point);
      if (lap === undefined) return; // beside the track: nothing, no camera move
      PV.selectLap(PV.lap.selected === lap ? null : lap);
    });
    // a user gesture during a 3D fit ease takes over (the ease is jumpTo per frame, not a MapLibre ease)
    map.on('movestart', (e) => {
      if (!e.originalEvent) return;
      fitToken += 1;
      map.setCenterClampedToGround(true);
    });
    map.on('load', () => {
      mapReady = true;
      M.update(PV.state, true);
    });
    PV.mapInstance = map;
    setupOrbit();
  };

  /* 3D picking: queryRenderedFeatures in a PICK_RADIUS box on the draped track; each segment feature
     carries its record index i, the hit nearest to the pointer wins → lapIndexAtRecord */
  const lapAtPoint = (point) => {
    const s = PV.session;
    if (!s || s.lapSpans.length === 0 || !mapReady || !map.getLayer('session-detail-line')) return undefined;
    const r = PICK_RADIUS;
    const hits = map.queryRenderedFeatures(
      [
        [point.x - r, point.y - r],
        [point.x + r, point.y + r],
      ],
      { layers: ['session-detail-line'] },
    );
    let best;
    let bestD = Infinity;
    for (const h of hits) {
      const i = h.properties.i;
      const q = map.project(s.path2d[i]);
      const d = Math.hypot(q.x - point.x, q.y - point.y);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best === undefined ? undefined : PV.lapAtRecord(s, best);
  };

  /* ---------- camera (mapPadding.ts:13-15 margins, fitPadding.ts PHONE_FIT_MARGIN 24) ---------- */
  const padding = () => {
    const W = innerWidth;
    const H = innerHeight;
    const loading = PV.state.scenario === 'loading';
    if (PV.device === 'desktop') {
      const main = document.querySelector('#main').getBoundingClientRect();
      const dock = document.querySelector('[data-layout="dock"]');
      const left = dock ? dock.getBoundingClientRect().right : 0;
      const ins = { top: 0, left, right: Math.max(0, W - main.left), bottom: loading ? 0 : 84 };
      const top = ins.top + 80;
      return { top, left: ins.left + 80, right: ins.right + 80, bottom: Math.min(ins.bottom + 80, H - top - 120) };
    }
    const sheetTop = document.querySelector('#main').getBoundingClientRect().top;
    const covered = H - sheetTop + (loading ? 0 : 12 + 44);
    const top = 24;
    return { top, left: 24, right: 24, bottom: Math.min(covered + 24, H - top - 120) };
  };
  M.padding = () => padding();

  /* Q37: entering 3D fits the session north up at a fixed tilt (extra "Entry tilt"); 2D is pitch 0 */
  const camera = (st) => {
    if (!PV.is3d(st)) return { pitch: 0, bearing: 0 };
    return { pitch: ENTRY_TILT, bearing: 0 };
  };

  // fitBounds(bounds, { padding, pitch }) cut the track at the near/left edge: the zoom comes from
  // cameraForBounds at pitch 0, the map padding keeps the free area's centre and the pitch is eased
  // in around it, 0.4 zoom out. cameraForBounds adds the map's current padding (and shifts its
  // centre for the padding), so the padding is reset and the unpadded centre is used.
  // record elevation (median) of a span: fallback for the terrain height when the DEM has no answer yet
  const medianElevation = (from, to) => {
    const v = PV.session.ele.slice(from, to + 1).filter((x) => x !== null).sort((a, b) => a - b);
    return v.length ? v[Math.floor(v.length / 2)] : undefined;
  };
  /* The page padding lives on the map (transform padding) and only changes when the layout does, so a
     fit never moves the map before its ease: cameraForBounds includes the transform padding, and ONE
     easeTo goes from the current camera straight to the target. (Before: setPadding({0}) at the start
     of every fit was itself a camera jump — the frame "somewhere else" before the lap fit.) */
  let padKey = '';
  const syncPadding = () => {
    const pad = padding();
    const key = JSON.stringify(pad);
    if (key === padKey) return;
    padKey = key;
    map.setPadding(pad);
  };
  const fitTo = (bounds, cam, opts) => {
    fitToken += 1;
    const token = fitToken;
    syncPadding();
    const fitOpts = { bearing: cam.bearing };
    if (opts.maxZoom !== undefined) fitOpts.maxZoom = opts.maxZoom; // an undefined maxZoom makes the result NaN
    const fit = map.cameraForBounds(bounds, fitOpts);
    if (!fit) return null;
    const target = {
      center: fit.center,
      zoom: fit.zoom - (cam.pitch > 0 ? 0.4 : 0), // pitched: the far half shrinks, 0.4 zoom out
      pitch: cam.pitch,
      bearing: cam.bearing,
    };
    if (!map.getTerrain()) {
      map.easeTo({ ...target, duration: opts.instant ? 0 : opts.duration });
      return fit.zoom;
    }
    // Terrain: the target camera must know the height of what it frames. cameraForBounds works on the
    // plane of the centre's elevation, so the target centre's ground height (queryTerrainElevation,
    // fallback: the median record elevation) goes into the target as CameraOptions.elevation.
    // MapLibre's easeTo cannot take an elevation (5.18: it samples the centre height from DEM tiles of
    // the zooms it passes, 0 m where a tile is not loaded, and without freezeElevation keeps that), so
    // the ease is ONE jumpTo per frame that interpolates centre, zoom, pitch, bearing AND elevation,
    // with centre clamping off for its duration: no settle afterwards, no drift growing with height.
    let ground = map.queryTerrainElevation(target.center);
    if (ground === null || ground === undefined) ground = opts.groundFallback;
    if (ground === null || ground === undefined) ground = map.transform.elevation;
    ease3d({ ...target, elevation: ground }, opts.instant ? 0 : opts.duration, token);
    return fit.zoom;
  };
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
  const ease3d = (target, duration, token) => {
    map.setCenterClampedToGround(false);
    const finish = () => {
      if (token !== fitToken) return;
      map.jumpTo(target);
      map.setCenterClampedToGround(true);
      if (fitEndCb) {
        const cb = fitEndCb;
        fitEndCb = null;
        cb();
      }
    };
    if (duration === 0) {
      finish();
      return;
    }
    const c0 = map.getCenter();
    const c1 = maplibregl.LngLat.convert(target.center);
    const z0 = map.getZoom();
    const p0 = map.getPitch();
    const b0 = map.getBearing();
    const e0 = map.transform.elevation;
    const db = ((target.bearing - b0 + 540) % 360) - 180;
    const t0 = performance.now();
    const step = (now) => {
      if (token !== fitToken) return; // a newer fit or a user gesture took over
      const k = Math.min(1, (now - t0) / duration);
      if (k >= 1) {
        finish();
        return;
      }
      const e = easeInOut(k);
      // centre weight that moves the target linearly on screen while the zoom changes (like MapLibre's
      // own ease): w = (1 − 2^(−Δz·e)) / (1 − 2^(−Δz)); plain linear lng/lat swung the lap off and back
      const dz = target.zoom - z0;
      const w = Math.abs(dz) < 1e-3 ? e : (1 - 2 ** (-dz * e)) / (1 - 2 ** -dz);
      map.jumpTo({
        center: [c0.lng + (c1.lng - c0.lng) * w, c0.lat + (c1.lat - c0.lat) * w],
        zoom: z0 + (target.zoom - z0) * e,
        pitch: p0 + (target.pitch - p0) * e,
        bearing: b0 + db * e,
        elevation: e0 + (target.elevation - e0) * e,
      });
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  /* 2D: today's fits, map.fitBounds with the page padding (useMapCameraEffect.ts), no zoom-out limit */
  const fit2d = (bounds, opts) => {
    fitToken += 1;
    syncPadding();
    // today: fitBounds with the page padding; here the same padding sits on the map (see syncPadding)
    const o = { pitch: 0, bearing: 0, duration: opts.instant ? 0 : opts.duration };
    if (opts.maxZoom !== undefined) o.maxZoom = opts.maxZoom;
    map.fitBounds(bounds, o);
  };
  const fitCamera = (st, instant) => {
    map.setMinZoom(0);
    fittedZoom = null;
    if (!PV.is3d(st)) {
      fit2d(PV.session.bounds, { instant, duration: SESSION_FIT_MS });
      return;
    }
    // Q18 in 3D only (Q35 dropped it in 2D): minZoom = fitted session zoom − 2, once the fit has ended
    fitEndCb = () => {
      if (fittedZoom !== null && PV.is3d(PV.state)) map.setMinZoom(Math.max(0, fittedZoom - MIN_ZOOM_BELOW_FIT));
    };
    fittedZoom = fitTo(PV.session.bounds, camera(st), { instant, duration: SESSION_FIT_MS, groundFallback: medianElevation(0, PV.session.n - 1) });
    if (instant && fittedZoom !== null && PV.is3d(PV.state)) map.setMinZoom(Math.max(0, fittedZoom - MIN_ZOOM_BELOW_FIT));
  };
  /* lap (de)selection: 2D as today (fit the lap, max zoom 16 / back to the session);
     3D (Q29): frame the lap / the session at the CURRENT pitch and bearing */
  M.lapChanged = () => {
    if (!mapReady || innerWidth === 0) return;
    M.update(PV.state);
    if (PV.state.scenario === 'loading') return;
    fitEndCb = null;
    const span = lapSpan(PV.lap.selected);
    if (!PV.is3d(PV.state)) {
      if (span) fit2d(span.bounds, { maxZoom: LAP_MAX_ZOOM, duration: LAP_FIT_MS });
      else fit2d(PV.session.bounds, { duration: SESSION_FIT_MS });
      return;
    }
    const cam = { pitch: map.getPitch(), bearing: map.getBearing() };
    if (span) fitTo(span.bounds, cam, { maxZoom: LAP_MAX_ZOOM, duration: LAP_FIT_MS, groundFallback: medianElevation(span.from, span.to) });
    else fitTo(PV.session.bounds, cam, { duration: SESSION_FIT_MS, groundFallback: medianElevation(0, PV.session.n - 1) });
  };

  /* 2D: today's handlers. 3D: right-drag rotate/tilt and two-finger pitch (Q17, Q31), no box zoom
     (Shift+drag orbits, Q23), double-click per Q28 */
  const setGestures = (on) => {
    const st = PV.state;
    map.setMaxPitch(on ? MAX_PITCH_3D : MAX_PITCH_FLAT);
    for (const h of [map.dragPan, map.scrollZoom, map.keyboard, map.touchZoomRotate]) h.enable();
    map.touchZoomRotate.enableRotation(); // two-finger twist rotates in 2D today too (touchZoomRotate on)
    if (on) {
      map.dragRotate.enable();
      map.touchPitch.enable();
      map.boxZoom.disable();
    } else {
      map.dragRotate.disable();
      map.touchPitch.disable();
      map.boxZoom.enable();
    }
    if (on) map.doubleClickZoom.disable(); // Q28: nothing in 3D; 2D: today's double-click zoom
    else map.doubleClickZoom.enable();
  };

  /* ---------- Q23–Q26: modifier + left-drag orbits around the point under the cursor ----------
     Detail page only (Q26). Shift, Ctrl or Cmd + left drag: horizontal = bearing, vertical = pitch
     (3D only; Q35: in 2D Shift+drag stays today's box zoom). The pivot is the map point under the cursor at mousedown;
     map.unproject/map.project are terrain-aware in MapLibre 5, so with terrain it is the terrain
     point. Each move: jumpTo({ bearing, pitch }), then panBy(projected pivot − start point), up to 3
     steps, so the pivot stays where it was grabbed. MapLibre's dragPan/dragRotate are disabled for the
     gesture (its own Ctrl+left rotate would run a second orbit); the mousedown is not swallowed, so a
     modifier click without drag stays a plain click. */
  const ORBIT = { degPerPx: 0.4, pitchPerPx: 0.3, threshold: 3, anchorSteps: 3, maxCenterShift: 20000 }; // metres
  const setupOrbit = () => {
    const el = document.querySelector('#map');
    let drag = null;
    const modifier = (e) => e.shiftKey || e.ctrlKey || e.metaKey;
    const holdHandlers = () => {
      map.dragPan.disable();
      map.dragRotate.disable();
    };
    el.addEventListener(
      'mousedown',
      (e) => {
        if (e.button !== 0 || !modifier(e) || !mapReady || !PV.is3d(PV.state)) return; // 2D: Shift+drag = box zoom, as today
        holdHandlers();
        const rect = map.getCanvas().getBoundingClientRect();
        const p0 = [e.clientX - rect.left, e.clientY - rect.top];
        drag = { x: e.clientX, y: e.clientY, p0, pivot: map.unproject(p0), bearing: map.getBearing(), pitch: map.getPitch(), moved: false };
        PV.orbitPivot = { lngLat: drag.pivot, point: p0 };
      },
      true,
    );
    addEventListener('mousemove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) < ORBIT.threshold) return;
      if (!drag.moved) {
        drag.moved = true;
        holdHandlers();
      }
      const bearing = drag.bearing + dx * ORBIT.degPerPx;
      const pitch = Math.min(map.getMaxPitch(), Math.max(0, drag.pitch - dy * ORBIT.pitchPerPx));
      const good = { center: map.getCenter(), zoom: map.getZoom(), bearing: map.getBearing(), pitch: map.getPitch() };
      map.jumpTo({ bearing, pitch });
      for (let k = 0; k < ORBIT.anchorSteps; k++) {
        const p = map.project(drag.pivot);
        const ox = p.x - drag.p0[0];
        const oy = p.y - drag.p0[1];
        if (Math.hypot(ox, oy) < 0.3) break;
        map.panBy([ox, oy], { duration: 0 });
      }
      // a pivot near the horizon (low on screen, steep pitch) would need the centre hundreds of km
      // away to stay put (seen at 85°: the map jumped to Franconia); keep the last good camera then
      if (map.getCenter().distanceTo(drag.pivot) > ORBIT.maxCenterShift) map.jumpTo(good);
    });
    addEventListener('mouseup', () => {
      if (!drag) return;
      drag = null;
      setGestures(PV.is3d(PV.state));
    });
    // macOS: Ctrl + left click also fires contextmenu; it must not start MapLibre's right-drag rotate
    el.addEventListener(
      'contextmenu',
      (e) => {
        if (drag || (e.ctrlKey && PV.is3d(PV.state))) {
          e.preventDefault();
          e.stopPropagation();
        }
      },
      true,
    );
  };

  /* ---------- 2D: today's deck.gl layers (DeckGLOverlay.tsx:116-141,202-274,352-371) ---------- */
  const spanPath = (span) => (span ? { path: PV.session.path2d.slice(span.from, span.to + 1), color: PV.colors.slice(span.from, span.to + 1) } : null);
  const lapAtInfo = (info) => {
    const s = PV.session;
    if (!info.coordinate) return undefined;
    const lng = info.coordinate[0];
    const lat = info.coordinate[1];
    const cosLat = Math.cos((lat * Math.PI) / 180);
    let best = -1;
    let bestD = Infinity;
    for (let i = 0; i < s.n; i++) {
      const d = ((s.lng[i] - lng) * cosLat) ** 2 + (s.lat[i] - lat) ** 2;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best < 0 ? undefined : PV.lapAtRecord(s, best); // lapPath.ts nearestRecordIndex → lapIndexAtRecord
  };
  let detail2d = null;
  let detail2dKey = '';
  const deckLayers2d = (st) => {
    const s = PV.session;
    const key = [st.scenario, st.colorBy, PV.lap.selected !== null].join('|');
    if (key !== detail2dKey) {
      detail2dKey = key;
      detail2d = new deck.PathLayer({
        id: 'session-detail',
        data: [{ path: s.path2d, color: flatColors() }],
        getPath: (d) => d.path,
        getColor: (d) => d.color,
        getWidth: PV.TRACK.width.highlighted,
        widthMinPixels: 1,
        jointRounded: true,
        capRounded: true,
        pickable: true,
        onClick: (info) => {
          const lap = lapAtInfo(info);
          if (lap === undefined) return false;
          PV.selectLap(PV.lap.selected === lap ? null : lap);
          return true;
        },
        onHover: (info) => {
          hoveringTrack = Boolean(info.object);
          map.getCanvas().style.cursor = hoveringTrack ? 'pointer' : ''; // MapGL cursor prop (MapBackground.tsx:91)
          let lap = null;
          if (PV.device === 'desktop' && info.object) lap = lapAtInfo(info) ?? null;
          PV.hoverLap(lap);
        },
      });
    }
    const hov = PV.lap.hovered === PV.lap.selected ? null : spanPath(lapSpan(PV.lap.hovered));
    const sel = spanPath(lapSpan(PV.lap.selected));
    const time = PV.cursorTime; // 2D: the dot jumps to the record at the chart cursor, as today
    let dot = [];
    if (time !== null) dot = [{ position: s.path2d[PV.indexAtTime(s, time)] }];
    return [
      detail2d,
      new deck.PathLayer({ id: 'lap-hover', data: hov ? [hov] : [], visible: hov !== null, getPath: (d) => d.path, getColor: [255, 255, 255, 255], getWidth: 3, widthUnits: 'pixels', jointRounded: true, capRounded: true }),
      new deck.PathLayer({ id: 'lap-casing', data: sel ? [sel] : [], getPath: (d) => d.path, getColor: [255, 255, 255, 255], getWidth: PV.TRACK.width.highlighted * LAP_CASING_SCALE, widthMinPixels: 9, jointRounded: true, capRounded: true }),
      new deck.PathLayer({ id: 'lap-selected', data: sel ? [sel] : [], getPath: (d) => d.path, getColor: (d) => d.color, getWidth: PV.TRACK.width.highlighted, widthMinPixels: 5, jointRounded: true, capRounded: true }),
      new deck.ScatterplotLayer({
        id: 'hovered-point',
        data: dot,
        visible: time !== null,
        getPosition: (d) => d.position,
        getRadius: 12,
        radiusUnits: 'pixels',
        getFillColor: [255, 255, 255, PV.TRACK.alpha.highlighted],
        filled: true,
        stroked: true,
        getLineColor: [0, 0, 0, PV.TRACK.alpha.default],
        lineWidthUnits: 'pixels',
        getLineWidth: 4,
        pickable: false,
      }),
    ];
  };

  /* ---------- 3D: MapLibre track + lap layers, draped on the terrain ---------- */
  const EMPTY = { type: 'FeatureCollection', features: [] };
  const toCss = (c) => `rgba(${c[0]},${c[1]},${c[2]},${(c[3] / 255).toFixed(3)})`;
  const firstRoadLayer = () => {
    const l = map.getStyle().layers.find((x) => x['source-layer'] === 'transportation');
    return l ? l.id : undefined;
  };
  // width of `metres` with a pixel minimum, as deck's getWidth (metres) + widthMinPixels
  const widthExpr = (metres, minPx) => {
    const mpp0 = 78271.517 * Math.cos((PV.session.center[1] * Math.PI) / 180); // metres per px at zoom 0, 512 px tiles
    const zMin = Math.log2((mpp0 * minPx) / metres);
    return ['interpolate', ['exponential', 2], ['zoom'], 0, minPx, zMin, minPx, 22, (metres * 2 ** 22) / mpp0];
  };
  const DIM = (c) => [Math.round(c[0] * DIMMED_BRIGHTNESS), Math.round(c[1] * DIMMED_BRIGHTNESS), Math.round(c[2] * DIMMED_BRIGHTNESS), c[3]];
  const segFeatures = (from, to, colors) => {
    const s = PV.session;
    const features = [];
    for (let i = from; i < to && i + 1 < s.n; i++)
      features.push({
        type: 'Feature',
        id: i,
        properties: { i, lap: s.recordLap[i], c: toCss(colors[i]), d: toCss(DIM(colors[i])) },
        geometry: { type: 'LineString', coordinates: [s.path2d[i], s.path2d[i + 1]] },
      });
    return { type: 'FeatureCollection', features };
  };
  const TRACK_LAYERS = ['hovered-point-circle', 'lap-selected-line', 'lap-casing-line', 'lap-hover-line', 'session-detail-line'];
  const TRACK_SOURCES = ['pv-hover', 'pv-track'];
  const removeTrack = () => {
    for (const id of TRACK_LAYERS) if (map.getLayer(id)) map.removeLayer(id);
    for (const id of TRACK_SOURCES) if (map.getSource(id)) map.removeSource(id);
    trackKey = '';
    lapKey = '';
  };
  const ensureTrack = (st) => {
    const kind = st.scenario === 'loading' || !PV.is3d(st) ? null : 'seg'; // 3D only (Q34); per-segment features
    const on = PV.is3d(st);
    const key = [kind, st.scenario, st.colorBy, on].join('|');
    if (!kind) {
      if (trackKey) removeTrack();
      return;
    }
    if (key === trackKey) return;
    removeTrack();
    trackKey = key;
    const s = PV.session;
    const minPx = on ? MIN_PX_3D : 1;
    const colors = PV.colors;
    const W = PV.TRACK.width.highlighted;
    // tolerance 0: with geojson-vt's default simplification (0.375) the 2-point segments of a few
      // metres are dropped at session zoom and the line shows gaps (verified here)
    map.addSource('pv-track', { type: 'geojson', tolerance: 0, data: segFeatures(0, s.n - 1, colors) });
    // a selected lap dims the rest (DIMMED_BRIGHTNESS) by switching the paint property, no data rebuild
    const paint = { 'line-color': ['get', PV.lap.selected === null ? 'c' : 'd'], 'line-width': widthExpr(W, minPx) };
    const round = { 'line-join': 'round', 'line-cap': 'round' };
    map.addLayer({ id: 'session-detail-line', type: 'line', source: 'pv-track', layout: round, paint });
    // lap layers draw the track source and show a lap through feature state (sel / hov on its segments):
    // setFeatureState updates on the main thread and is visible in the next frame; setData or setFilter
    // go through the GeoJSON worker and lagged a few frames behind the camera
    const shown = (state) => ['case', ['boolean', ['feature-state', state], false], 1, 0];
    map.addLayer({ id: 'lap-hover-line', type: 'line', source: 'pv-track', layout: round, paint: { 'line-color': '#ffffff', 'line-width': 3, 'line-opacity': shown('hov') } });
    map.addLayer({ id: 'lap-casing-line', type: 'line', source: 'pv-track', layout: round, paint: { 'line-color': '#ffffff', 'line-width': widthExpr(W * LAP_CASING_SCALE, 9), 'line-opacity': shown('sel') } });
    map.addLayer({ id: 'lap-selected-line', type: 'line', source: 'pv-track', layout: round, paint: { 'line-color': ['get', 'c'], 'line-width': widthExpr(W, Math.max(5, minPx)), 'line-opacity': shown('sel') } });
    shownSel = -1;
    shownHov = -1;
    map.addSource('pv-hover', { type: 'geojson', data: EMPTY });
    map.addLayer({
      id: 'hovered-point-circle',
      type: 'circle',
      source: 'pv-hover',
      paint: { 'circle-radius': 10, 'circle-color': '#ffffff', 'circle-stroke-width': 4, 'circle-stroke-color': 'rgba(0,0,0,0.31)' },
    });
  };
  const paintMlLaps = () => {
    if (!trackKey) return;
    map.setPaintProperty('session-detail-line', 'line-color', ['get', PV.lap.selected === null ? 'c' : 'd']);
    const key = [trackKey, PV.lap.selected, PV.lap.hovered].join('|');
    if (key === lapKey) return;
    lapKey = key;
    const sel = PV.lap.selected === null ? -1 : PV.lap.selected;
    let hov = PV.lap.hovered === null ? -1 : PV.lap.hovered;
    if (hov === sel) hov = -1;
    const mark = (lap, state, value) => {
      const span = lapSpan(lap < 0 ? null : lap);
      if (!span) return;
      for (let i = span.from; i < span.to; i++) map.setFeatureState({ source: 'pv-track', id: i }, { [state]: value });
    };
    if (sel !== shownSel) {
      mark(shownSel, 'sel', false);
      mark(sel, 'sel', true);
      shownSel = sel;
    }
    if (hov !== shownHov) {
      mark(shownHov, 'hov', false);
      mark(hov, 'hov', true);
      shownHov = hov;
    }
  };
  const cursorMl = () => {
    if (!trackKey) return;
    const s = PV.session;
    const time = PV.cursorTime; // Q39: the dot jumps to the record at the chart cursor, as in 2D
    let point = EMPTY;
    if (time !== null) point = { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: s.path2d[PV.indexAtTime(s, time)] } };
    map.getSource('pv-hover').setData(point);
  };

  /* ---------- terrain (3D only, Q15) ---------- */
  const removeTerrain = () => {
    if (!terrainKey) return;
    map.setTerrain(null);
    if (map.getLayer('pv-hillshade')) map.removeLayer('pv-hillshade');
    for (const id of ['mapterhorn', 'mapterhorn-hs']) if (map.getSource(id)) map.removeSource(id);
    terrainKey = '';
  };
  const ensureTerrain = (st) => {
    const key = String(st.scenario === 'offline');
    if (key === terrainKey) return;
    removeTerrain();
    terrainKey = key;
    const tiles = [st.scenario === 'offline' ? DEM_OFFLINE_URL : DEM_URL];
    // maxzoom 16: verified here, z17 tiles answer 404 around the route; MapLibre overzooms z16
    map.addSource('mapterhorn', { type: 'raster-dem', tiles, encoding: 'terrarium', tileSize: 512, maxzoom: 16, attribution: DEM_ATTRIBUTION });
    map.addSource('mapterhorn-hs', { type: 'raster-dem', tiles, encoding: 'terrarium', tileSize: 512, maxzoom: 16 });
    map.addLayer({ id: 'pv-hillshade', type: 'hillshade', source: 'mapterhorn-hs', paint: HILLSHADE }, firstRoadLayer());
    map.setTerrain({ source: 'mapterhorn', exaggeration: TERRAIN_EXAGGERATION });
  };



  /* ---------- update ---------- */
  M.update = (st, force) => {
    if (!st || !PV.session || !mapReady) return;
    const on = PV.is3d(st);
    PV.colors = PV.colorsFor(PV.session, st.colorBy);
    if (on && st.scenario !== 'loading') ensureTerrain(st);
    else removeTerrain();
    ensureTrack(st);
    setGestures(on);
    const cKey = [st.scenario, on].join('|');
    const visible = innerWidth > 0 && innerHeight > 0;
    const camChanged = force || cKey !== cameraKey;
    cameraKey = visible ? cKey : ''; // hidden frame (View: one device): fit once it is shown again
    if (st.scenario === 'loading') {
      fittedZoom = null;
      map.setMinZoom(0); // Q18: the limit belongs to the session and is reset when it is left
    } else if (camChanged && visible) fitCamera(st, force);
    M.paint();
  };

  M.paintLaps = () => M.paint();
  /* cursor/lap repaint: only the dynamic layers change */
  M.paint = () => {
    const st = PV.state;
    if (!mapReady || !st) return;
    if (innerWidth === 0 || innerHeight === 0) return; // hidden frame: deck has no viewport to draw into
    const on2d = !PV.is3d(st) && st.scenario !== 'loading';
    if (!on2d) detail2dKey = ''; // a layer removed from the overlay is finalized; build a new one on return
    overlay.setProps({
      layers: on2d ? deckLayers2d(st) : [], // 3D: deck.gl draws nothing session-related
      getCursor: () => (on2d && hoveringTrack ? 'pointer' : ''), // DeckGLOverlay.tsx:436
      // leaving the track clears the lap hover (DeckGLOverlay: onHover with no picked object)
      onHover: (info) => {
        if (on2d && (!info.layer || info.layer.id !== 'session-detail')) {
          hoveringTrack = false;
          map.getCanvas().style.cursor = '';
          if (PV.device === 'desktop') PV.hoverLap(null);
        }
      },
    });
    paintMlLaps();
    cursorMl();
  };
})();
