/* Startup loader mockup: data, camera, basemap, loader timing, draw-in, render loop. */
(() => {
  const SHELL = window.MockupShell;
  const W = { desktop: 1280, phone: 390 };
  const H = { desktop: 800, phone: 844 };

  // ---------- utils ----------
  const seeded = (seed) => {
    let s = seed >>> 0 || 1;
    const next = () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    return { next, between: (a, b) => a + (b - a) * next() };
  };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const easeOutCubicInv = (p) => 1 - Math.cbrt(1 - p);

  // cubic-bezier(.42,0,.58,1) = CSS ease-in-out
  const easeInOut = (x) => {
    const p1 = 0.42;
    const p2 = 0.58;
    const bx = (t) => 3 * (1 - t) * (1 - t) * t * p1 + 3 * (1 - t) * t * t * p2 + t * t * t;
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (bx(mid) < x) lo = mid;
      else hi = mid;
    }
    const t = (lo + hi) / 2;
    return 3 * (1 - t) * t * t + t * t * t; // y control points 0 and 1
  };

  // ---------- geography: local metres around Munich ----------
  const LAT0 = 48.137;
  const LNG0 = 11.575;
  const MX = 111320 * Math.cos((LAT0 * Math.PI) / 180);
  const MY = 110574;
  const toXY = (lat, lng) => [(lng - LNG0) * MX, -(lat - LAT0) * MY];

  const decode = (str) => {
    const out = [];
    let i = 0;
    let lat = 0;
    let lng = 0;
    while (i < str.length) {
      for (const which of [0, 1]) {
        let shift = 0;
        let result = 0;
        let b;
        do {
          b = str.charCodeAt(i++) - 63;
          result |= (b & 0x1f) << shift;
          shift += 5;
        } while (b >= 0x20);
        const d = result & 1 ? ~(result >> 1) : result >> 1;
        if (which === 0) lat += d;
        else lng += d;
      }
      out.push(toXY(lat / 1e5, lng / 1e5));
    }
    return out;
  };

  const DEMO = (window.DEMO_ROUTES || []).map((r) => ({
    key: r.key,
    name: r.name,
    sport: r.sport,
    pts: decode(r.polyline),
  }));

  const thin = (pts, max) => {
    if (pts.length <= max) return pts;
    const out = [];
    const step = (pts.length - 1) / (max - 1);
    for (let i = 0; i < max; i++) out.push(pts[Math.round(i * step)]);
    return out;
  };

  // A smoothed random walk offset, as the second onboarding pass (previewDrawIn.ts jitterPath)
  const jitter = (pts, r, metres, shift) => {
    let ox = (r.next() - 0.5) * metres + shift[0];
    let oy = (r.next() - 0.5) * metres + shift[1];
    return pts.map((p) => {
      ox = ox * 0.8 + ((r.next() - 0.5) * metres * 0.6 + shift[0] * 0.2);
      oy = oy * 0.8 + ((r.next() - 0.5) * metres * 0.6 + shift[1] * 0.2);
      return [p[0] + ox, p[1] + oy];
    });
  };

  // A loop from home: random heading drift, turning home in the second half
  const loop = (home, sport, r) => {
    const target = sport === 'running' ? r.between(5000, 16000) : r.between(22000, 60000);
    const step = sport === 'running' ? 140 : 450;
    const n = Math.max(12, Math.round(target / step));
    let h = r.next() * Math.PI * 2;
    let curve = 0;
    let x = home[0] + r.between(-600, 600);
    let y = home[1] + r.between(-600, 600);
    const pts = [[x, y]];
    for (let i = 1; i < n; i++) {
      curve = curve * 0.85 + (r.next() - 0.5) * 0.35;
      h += curve;
      if (i > n * 0.5) {
        const back = Math.atan2(home[1] - y, home[0] - x);
        let diff = back - h;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        h += diff * ((i / n - 0.5) * 0.9);
      }
      x += Math.cos(h) * step;
      y += Math.sin(h) * step;
      pts.push([x, y]);
    }
    return pts;
  };

  const DAY = 86400000;
  const T_FROM = Date.UTC(2019, 0, 1);
  const T_TO = Date.UTC(2026, 9, 20);

  const finish = (list) =>
    list.map((t, id) => {
      const cum = [0];
      for (let i = 1; i < t.pts.length; i++) {
        const a = t.pts[i - 1];
        const b = t.pts[i];
        cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
      }
      return { ...t, id, cum, len: cum[cum.length - 1] };
    });

  const library = (opts) => {
    const r = seeded(opts.seed);
    const out = [];
    const regions = opts.regions;
    for (let i = 0; i < opts.count; i++) {
      const reg = regions[Math.min(regions.length - 1, Math.floor(r.next() * regions.length * 0.999))];
      const pick = r.next();
      const date = r.between(T_FROM, T_TO);
      if (reg.demo && pick < opts.demoShare) {
        const base = DEMO[Math.floor(r.next() * DEMO.length)];
        const pts = jitter(base.pts, r, 60, [r.between(-350, 350), r.between(-350, 350)]);
        out.push({ sport: base.sport, pts: thin(pts, opts.maxPts), date });
        continue;
      }
      const sport = r.next() < reg.runShare ? 'running' : 'cycling';
      const home = [reg.c[0] + r.between(-reg.spread, reg.spread), reg.c[1] + r.between(-reg.spread, reg.spread)];
      out.push({ sport, pts: thin(loop(home, sport, r), opts.maxPts), date });
    }
    return finish(out);
  };

  const MUNICH = { c: [0, 0], spread: 3500, runShare: 0.65, demo: true };
  const STARNBERG = { c: [-17500, 15500], spread: 3000, runShare: 0.55, demo: false };
  const EBERSBERG = { c: [24000, 4000], spread: 3000, runShare: 0.5, demo: false };

  const builders = {
    warm: () => library({ seed: 11, count: 300, regions: [MUNICH], demoShare: 0.35, maxPts: 140 }),
    large: () =>
      library({
        seed: 23,
        count: 3000,
        regions: [MUNICH, MUNICH, STARNBERG, EBERSBERG],
        demoShare: 0.4,
        maxPts: 48,
      }),
    small: () =>
      finish(
        [0, 2, 3, 4, 6, 8, 9, 13].map((i, k) => ({
          sport: DEMO[i].sport,
          pts: DEMO[i].pts,
          date: T_FROM + k * 120 * DAY,
        })),
      ),
    first: () => library({ seed: 5, count: 24, regions: [MUNICH], demoShare: 0.6, maxPts: 200 }),
    onboarding: () => {
      const r = seeded(7);
      const out = [];
      for (const round of [0, 1])
        for (const d of DEMO)
          out.push({ sport: d.sport, pts: round === 0 ? d.pts : jitter(d.pts, r, 22, [0, 0]), date: T_FROM + out.length * DAY });
      return finish(out);
    },
    session: () => finish([{ sport: DEMO[0].sport, pts: DEMO[0].pts, date: T_TO }]),
    nojs: () => [],
  };
  builders.cold = builders.warm;
  builders.never = builders.warm;
  const cache = {};
  const tracksFor = (scenario) => {
    if (!cache[scenario]) cache[scenario] = builders[scenario]();
    return cache[scenario];
  };

  const boundsOf = (tracks) => {
    const b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
    for (const t of tracks)
      for (const p of t.pts) {
        b.x0 = Math.min(b.x0, p[0]);
        b.y0 = Math.min(b.y0, p[1]);
        b.x1 = Math.max(b.x1, p[0]);
        b.y1 = Math.max(b.y1, p[1]);
      }
    return b;
  };

  // The visible map rect the camera fits into (map padding, minus content column / sheet)
  const FIT_RECT = {
    desktop: { x: 110, y: 50, w: 744 - 50 - 110, h: 800 - 100 },
    phone: { x: 24, y: 96, w: 390 - 48, h: 363 - 96 - 24 },
  };
  const fit = (b, dev) => {
    const r = FIT_RECT[dev];
    const bw = Math.max(200, b.x1 - b.x0);
    const bh = Math.max(200, b.y1 - b.y0);
    const s = Math.min(r.w / bw, r.h / bh, 0.25);
    return { s, cx: (b.x0 + b.x1) / 2, cy: (b.y0 + b.y1) / 2, px: r.x + r.w / 2, py: r.y + r.h / 2 };
  };
  const project = (cam, p) => [(p[0] - cam.cx) * cam.s + cam.px, (p[1] - cam.cy) * cam.s + cam.py];

  // ---------- basemap (a stand-in for CARTO dark-matter, no tiles) ----------
  const wavy = (r, a, b, amp, n) => {
    const pts = [];
    let off = 0;
    const nx = -(b[1] - a[1]);
    const ny = b[0] - a[0];
    const nl = Math.hypot(nx, ny) || 1;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      off = off * 0.7 + (r.next() - 0.5) * amp;
      const damp = Math.sin(Math.PI * t);
      pts.push([a[0] + (b[0] - a[0]) * t + (nx / nl) * off * damp, a[1] + (b[1] - a[1]) * t + (ny / nl) * off * damp]);
    }
    return pts;
  };
  const ellipse = (r, c, rx, ry, rot) => {
    const pts = [];
    const n = 48;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const k = 1 + (r.next() - 0.5) * 0.18;
      const x = Math.cos(a) * rx * k;
      const y = Math.sin(a) * ry * k;
      pts.push([c[0] + x * Math.cos(rot) - y * Math.sin(rot), c[1] + x * Math.sin(rot) + y * Math.cos(rot)]);
    }
    return pts;
  };

  const WORLD = (() => {
    const r = seeded(99);
    const motorways = [];
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + r.between(-0.2, 0.2);
      const r0 = 4000;
      motorways.push(wavy(r, [Math.cos(a) * r0, Math.sin(a) * r0], [Math.cos(a) * 95000, Math.sin(a) * 95000], 2500, 40));
    }
    const ring = [];
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      ring.push([Math.cos(a) * 14000 + r.between(-300, 300), Math.sin(a) * 12000 + r.between(-300, 300)]);
    }
    motorways.push(ring);
    const towns = [[0, 0, 8500]];
    for (let i = 0; i < 70; i++) towns.push([r.between(-90000, 90000), r.between(-90000, 90000), r.between(500, 1600)]);
    towns.push([STARNBERG.c[0], STARNBERG.c[1], 2200], [EBERSBERG.c[0], EBERSBERG.c[1], 2000]);
    const mains = [];
    for (const t of towns) {
      const near = towns
        .filter((o) => o !== t)
        .map((o) => [o, Math.hypot(o[0] - t[0], o[1] - t[1])])
        .sort((a, b) => a[1] - b[1])
        .slice(0, 3);
      for (const [o, d] of near) mains.push(wavy(r, [t[0], t[1]], [o[0], o[1]], d * 0.08, 18));
    }
    const streets = [];
    for (const t of towns) {
      const rad = t[2];
      const spacing = rad > 5000 ? 380 : 260;
      const rot = r.between(-0.4, 0.4);
      for (let gx = -rad; gx <= rad; gx += spacing)
        for (let gy = -rad; gy <= rad; gy += spacing) {
          if (Math.hypot(gx, gy) > rad * r.between(0.7, 1)) continue;
          if (r.next() < 0.25) continue;
          const horiz = r.next() < 0.5;
          const len = spacing * r.between(0.8, 2.2);
          const x0 = gx;
          const y0 = gy;
          const x1 = horiz ? gx + len : gx + r.between(-40, 40);
          const y1 = horiz ? gy + r.between(-40, 40) : gy + len;
          const rx = (x, y) => [t[0] + x * Math.cos(rot) - y * Math.sin(rot), t[1] + x * Math.sin(rot) + y * Math.cos(rot)];
          streets.push([rx(x0, y0), rx(x1, y1)]);
        }
    }
    const isar = wavy(r, [-26000, 60000], [30000, -42000], 2200, 80);
    const lakes = [
      ellipse(r, [-21000, 30000], 2300, 9500, 0.1),
      ellipse(r, [-34000, 21000], 2400, 7800, -0.15),
      ellipse(r, [14000, 66000], 1300, 3600, 0.2),
    ];
    for (let i = 0; i < 18; i++) {
      const s = r.between(150, 700);
      lakes.push(ellipse(r, [r.between(-80000, 80000), r.between(-80000, 80000)], s, s * r.between(0.5, 1.5), r.next()));
    }
    const parks = [ellipse(r, [700, -2600], 600, 2400, 0.25), ellipse(r, [-3800, -2400], 900, 650, 0)];
    return { motorways, mains, streets, isar, lakes, parks };
  })();

  const paintBase = (canvas, cam, w, h, dpr) => {
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, w, h);
    const line = (pts) => {
      ctx.beginPath();
      pts.forEach((p, i) => {
        const q = project(cam, p);
        if (i === 0) ctx.moveTo(q[0], q[1]);
        else ctx.lineTo(q[0], q[1]);
      });
    };
    const s = cam.s;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // parks
    ctx.fillStyle = 'rgba(30, 41, 59, 0.25)';
    for (const p of WORLD.parks) {
      line(p);
      ctx.closePath();
      ctx.fill();
    }
    // water
    ctx.fillStyle = '#0b1424';
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.35)';
    ctx.lineWidth = 0.6;
    for (const l of WORLD.lakes) {
      line(l);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.strokeStyle = '#0b1424';
    ctx.lineWidth = Math.max(1.2, 70 * s);
    line(WORLD.isar);
    ctx.stroke();
    // streets fade in with zoom
    const streetAlpha = clamp((s - 0.006) / 0.03, 0, 1) * 0.2;
    if (streetAlpha > 0.01) {
      ctx.strokeStyle = `rgba(71, 85, 105, ${streetAlpha})`;
      ctx.lineWidth = Math.max(0.5, 10 * s);
      ctx.beginPath();
      for (const st of WORLD.streets) {
        const a = project(cam, st[0]);
        const b = project(cam, st[1]);
        if ((a[0] < -20 && b[0] < -20) || (a[0] > w + 20 && b[0] > w + 20)) continue;
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
      }
      ctx.stroke();
    }
    ctx.strokeStyle = `rgba(100, 116, 139, ${0.16 + clamp(s * 6, 0, 0.12)})`;
    ctx.lineWidth = Math.max(0.6, 14 * s);
    for (const m of WORLD.mains) {
      line(m);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.4)';
    ctx.lineWidth = Math.max(1, 26 * s);
    for (const m of WORLD.motorways) {
      line(m);
      ctx.stroke();
    }
  };

  // ---------- scenarios: when React mounts, tiles arrive, the app is ready ----------
  const SCN = {
    warm: { mount: 150, tiles: 450, ready: 400 },
    cold: { mount: 700, tiles: 1800, ready: 2600 },
    large: { mount: 300, tiles: 900, ready: 1800 },
    small: { mount: 150, tiles: 450, ready: 350 },
    first: { mount: 0, tiles: 0, ready: 0, noLoader: true, importAt: 1500 },
    onboarding: { mount: 200, tiles: 600, ready: 700 },
    never: { mount: 200, tiles: 4000, ready: Infinity, lateAt: 12500 },
    session: { mount: 200, tiles: 600, ready: 500, noDraw: true },
    nojs: { mount: Infinity, tiles: Infinity, ready: Infinity, noCap: true },
  };
  const CAP = 10000;

  // ---------- loader timing per variant ----------
  const FADE = { A: 400, B: 300, C: 400, D: 600, E: 400 };
  const schedule = (variant, sc) => {
    const ready = sc.ready;
    const finite = Number.isFinite(ready);
    const out = { cycle: 3000, logoFrom: 0, fade: FADE[variant], hold: true, blur: false, shrink: false };
    let handoff = Infinity;
    if (variant === 'A' || variant === 'D') {
      out.cycle = 1500;
      if (finite) handoff = Math.ceil(Math.max(ready, 1500) / 1500) * 1500;
      out.blur = variant === 'D';
    } else if (variant === 'B') {
      out.cycle = 3000;
      if (finite) {
        const r = Math.max(ready, 800);
        const pr = (r % 3000) / 3000;
        out.rushAt = r;
        out.rushFrom = pr;
        handoff = pr < 1e-6 ? r : r + (1 - pr) * 1000;
      }
    } else if (variant === 'C') {
      out.cycle = 1500;
      if (finite && ready < 700) {
        handoff = ready;
        out.fade = 250;
        out.logoFrom = Infinity;
      } else {
        out.logoFrom = 700;
        if (finite) handoff = 700 + Math.ceil(Math.max(ready - 700, 1500) / 1500) * 1500;
      }
    } else if (variant === 'E') {
      out.cycle = 3000;
      out.hold = false;
      out.shrink = true;
      if (finite) handoff = Math.max(ready, 1000);
    }
    out.capped = false;
    if (!finite && !sc.noCap) {
      handoff = CAP;
      out.capped = true;
      out.hold = false;
    }
    out.handoff = handoff;
    out.drawStart = null;
    if (finite && !sc.noDraw) out.drawStart = variant === 'D' ? handoff : handoff + out.fade;
    if (sc.noLoader) {
      out.handoff = -1;
      out.fade = 0;
      out.drawStart = sc.importAt;
    }
    // cycle progress 0..1 (0 and 1 = empty logo)
    out.phaseAt = (t) => {
      const lt = t - (Number.isFinite(out.logoFrom) ? out.logoFrom : 0);
      if (lt < 0) return 0;
      if (variant === 'B' && out.rushAt !== undefined && t >= out.rushAt) {
        return Math.min(1, out.rushFrom + ((t - out.rushAt) * 3) / 3000);
      }
      if (out.hold && t >= out.handoff) return 0;
      return (lt % out.cycle) / out.cycle;
    };
    out.fadeK = (t) => {
      if (t < out.handoff) return 0;
      if (out.fade <= 0) return 1;
      return easeInOut(clamp((t - out.handoff) / out.fade, 0, 1));
    };
    out.logoOpacity = (t) => {
      if (!Number.isFinite(out.logoFrom)) return 0;
      if (out.logoFrom === 0) return 1;
      return clamp((t - out.logoFrom) / 400, 0, 1);
    };
    return out;
  };

  // L3 keyframes (packages/ui/src/theme.css): [start, end] of grow and retract per stroke
  const STROKE_KEYS = [
    [0, 0.4, 0.8],
    [0.1, 0.5, 0.9],
    [0.2, 0.6, 1.0],
  ];
  const strokeOffset = (i, p) => {
    const k = STROKE_KEYS[i];
    if (p <= k[0]) return 1.05;
    if (p <= k[1]) return 1.05 - 1.05 * easeInOut((p - k[0]) / (k[1] - k[0]));
    if (p <= k[2]) return -1.05 * easeInOut((p - k[1]) / (k[2] - k[1]));
    return -1.05;
  };

  // ---------- draw-in: per-vertex timestamps, baked as for TripsLayer ----------
  const bake = (tracks, v, scenario) => {
    const r = seeded(3);
    const n = tracks.length;
    const plan = new Array(n);
    const set = (i, start, dur, eased) => (plan[i] = { start, dur, eased });
    if (v === 'V1') tracks.forEach((t, i) => set(i, 0, 1500, true));
    if (v === 'V2' || v === 'V5') {
      const order = tracks.map((t, i) => [i, r.next()]).sort((a, b) => a[1] - b[1]);
      order.forEach((o, k) => set(o[0], (k / Math.max(1, n)) * 1000, r.between(800, 1400), true));
    }
    if (v === 'V3') {
      const b = boundsOf(tracks);
      const c = [(b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2];
      const d = tracks.map((t) => Math.hypot(t.pts[0][0] - c[0], t.pts[0][1] - c[1]));
      const dmax = Math.max(1, ...d);
      tracks.forEach((t, i) => set(i, (d[i] / dmax) * 1200, 1200, true));
    }
    if (v === 'V4') {
      const order = tracks.map((t, i) => [i, t.date]).sort((a, b) => a[1] - b[1]);
      order.forEach((o, k) => set(o[0], (k / Math.max(1, n - 1)) * 3000, 600, true));
    }
    if (v === 'V6') {
      const lens = tracks.map((t) => t.len).sort((a, b) => a - b);
      const p75 = lens[Math.floor(lens.length * 0.75)] || 1;
      const speed = p75 / 1500;
      tracks.forEach((t, i) => {
        const start = r.between(0, 300);
        set(i, start, Math.max(200, Math.min(t.len / speed, 2500 - start)), false);
      });
    }
    let end = 0;
    const baked = tracks.map((t, i) => {
      const p = plan[i];
      const ts = new Float32Array(t.pts.length);
      for (let k = 0; k < t.pts.length; k++) {
        const f = t.len > 0 ? t.cum[k] / t.len : 1;
        ts[k] = p.start + p.dur * (p.eased ? easeOutCubicInv(f) : f);
      }
      end = Math.max(end, ts[ts.length - 1]);
      return ts;
    });
    return { baked, end, comets: v === 'V5' };
  };

  // ---------- per-frame state ----------
  const COLOR = { running: [74, 222, 128], cycling: [249, 115, 22] };
  const ALPHA = { faint: 80, warm: 160, hot: 255 };
  const rgba = (sport, a) => `rgba(${COLOR[sport].join(',')},${a})`;
  const DPR = Math.min(2, window.devicePixelRatio || 1);

  const devices = {};
  let run = null;
  const stats = { frames: 0 };

  const setupDevice = (root) => {
    const dev = root.dataset.device;
    if (devices[dev] && devices[dev].root === root) return devices[dev];
    const q = (s) => root.querySelector(s);
    const d = {
      dev,
      root,
      app: q('.app'),
      map: q('.map'),
      base: q('.map-base'),
      tracks: q('.map-tracks'),
      done: document.createElement('canvas'),
      boot: q('.boot'),
      strokes: [...root.querySelectorAll('.js-stroke')],
      logo: q('.boot__logo'),
      ms: q('.js-ms'),
      phase: q('.js-phase'),
      lock: q('.js-lock'),
      lockText: q('.js-lock-text'),
      lockClosed: q('.js-lock-closed'),
      lockOpen: q('.js-lock-open'),
      highlight: -1,
      grid: null,
    };
    root.querySelectorAll('.js-grad').forEach((g, i) => {
      g.id = `logo-grad-${dev}-${i}`;
      d.strokes[i].setAttribute('stroke', `url(#${g.id})`);
    });
    for (const c of [d.tracks, d.done]) {
      c.width = W[dev] * DPR;
      c.height = H[dev] * DPR;
    }
    const local = (e) => {
      const r = d.map.getBoundingClientRect();
      return [((e.clientX - r.left) * W[dev]) / r.width, ((e.clientY - r.top) * H[dev]) / r.height];
    };
    if (dev === 'desktop') {
      d.map.addEventListener('pointermove', (e) => {
        if (!run || !run.unlocked) return;
        const hit = pick(d, local(e), 6);
        d.highlight = hit;
        d.map.classList.toggle('is-pointer', hit >= 0);
      });
      d.map.addEventListener('pointerleave', () => {
        d.highlight = -1;
        d.map.classList.remove('is-pointer');
      });
    } else {
      d.map.addEventListener('click', (e) => {
        if (!run || !run.unlocked) return;
        d.highlight = pick(d, local(e), 12);
      });
    }
    devices[dev] = d;
    return d;
  };

  // ---------- picking (only once unlocked) ----------
  const CELL = 16;
  const buildGrid = (d) => {
    const grid = new Map();
    d.xy.forEach((xy, i) => {
      for (let k = 2; k < xy.length; k += 2) {
        const cx = Math.floor((xy[k - 2] + xy[k]) / 2 / CELL);
        const cy = Math.floor((xy[k - 1] + xy[k + 1]) / 2 / CELL);
        const key = cx * 10000 + cy;
        if (!grid.has(key)) grid.set(key, []);
        grid.get(key).push(i, k);
      }
    });
    return grid;
  };
  const segDist = (p, ax, ay, bx, by) => {
    const dx = bx - ax;
    const dy = by - ay;
    const l = dx * dx + dy * dy;
    const t = l > 0 ? clamp(((p[0] - ax) * dx + (p[1] - ay) * dy) / l, 0, 1) : 0;
    return Math.hypot(p[0] - (ax + dx * t), p[1] - (ay + dy * t));
  };
  const pick = (d, p, radius) => {
    if (!d.grid) d.grid = buildGrid(d);
    let best = -1;
    let bestD = radius;
    const cx = Math.floor(p[0] / CELL);
    const cy = Math.floor(p[1] / CELL);
    for (let gx = cx - 2; gx <= cx + 2; gx++)
      for (let gy = cy - 2; gy <= cy + 2; gy++) {
        const list = d.grid.get(gx * 10000 + gy);
        if (!list) continue;
        for (let j = 0; j < list.length; j += 2) {
          const xy = d.xy[list[j]];
          const k = list[j + 1];
          const dist = segDist(p, xy[k - 2], xy[k - 1], xy[k], xy[k + 1]);
          if (dist < bestD) {
            bestD = dist;
            best = list[j];
          }
        }
      }
    return best;
  };

  // ---------- track drawing ----------
  const strokeUntil = (ctx, xy, ts, T) => {
    ctx.beginPath();
    ctx.moveTo(xy[0], xy[1]);
    for (let k = 1; k < ts.length; k++) {
      if (ts[k] <= T) {
        ctx.lineTo(xy[2 * k], xy[2 * k + 1]);
        continue;
      }
      const span = ts[k] - ts[k - 1];
      const f = span > 0 ? (T - ts[k - 1]) / span : 1;
      ctx.lineTo(xy[2 * k - 2] + (xy[2 * k] - xy[2 * k - 2]) * f, xy[2 * k - 1] + (xy[2 * k + 1] - xy[2 * k - 1]) * f);
      break;
    }
    ctx.stroke();
  };
  const at = (xy, ts, T) => {
    if (T <= ts[0]) return [xy[0], xy[1], 0];
    for (let k = 1; k < ts.length; k++) {
      if (ts[k] >= T) {
        const span = ts[k] - ts[k - 1];
        const f = span > 0 ? (T - ts[k - 1]) / span : 1;
        return [xy[2 * k - 2] + (xy[2 * k] - xy[2 * k - 2]) * f, xy[2 * k - 1] + (xy[2 * k + 1] - xy[2 * k - 1]) * f, k];
      }
    }
    const n = ts.length - 1;
    return [xy[2 * n], xy[2 * n + 1], n + 1];
  };
  // A comet head: the stretch between T - trail and T, in fading chunks (fadeTrail)
  const TRAIL = 250;
  const strokeHead = (ctx, xy, ts, T, sport) => {
    const end = ts[ts.length - 1];
    const from = Math.max(ts[0], T - TRAIL);
    const to = Math.min(T, end);
    if (to <= from) return;
    const chunks = 5;
    for (let c = 0; c < chunks; c++) {
      const a = from + ((to - from) * c) / chunks;
      const b = from + ((to - from) * (c + 1)) / chunks;
      const age = (T - b) / TRAIL;
      ctx.strokeStyle = rgba(sport, clamp(1 - age, 0, 1) * 0.95);
      const pa = at(xy, ts, a);
      const pb = at(xy, ts, b);
      ctx.beginPath();
      ctx.moveTo(pa[0], pa[1]);
      for (let k = pa[2]; k < pb[2] && k < ts.length; k++) ctx.lineTo(xy[2 * k], xy[2 * k + 1]);
      ctx.lineTo(pb[0], pb[1]);
      ctx.stroke();
    }
  };

  // ---------- run ----------
  const LABELS = {
    en: {
      loading: 'Loading',
      handoff: 'Hand-off',
      both: 'Hand-off + draw-in',
      drawin: 'Draw-in',
      done: 'Done',
      import: 'Import · empty map',
      waiting: 'Cap · loader gone',
      late: 'Done · no draw-in',
      nojs: 'No JS · loader only',
      locked: 'Picking locked',
      open: 'Picking on',
    },
    de: {
      loading: 'Laden',
      handoff: 'Übergabe',
      both: 'Übergabe + Zeichnen',
      drawin: 'Einzeichnen',
      done: 'Fertig',
      import: 'Import · leere Karte',
      waiting: 'Limit · Loader weg',
      late: 'Fertig · ohne Einzeichnen',
      nojs: 'Kein JS · nur Loader',
      locked: 'Auswahl gesperrt',
      open: 'Auswahl aktiv',
    },
  };
  const DEFAULT_BOUNDS = { x0: -12000, y0: -9000, x1: 12000, y1: 9000 };
  const fmt = (ms) => (Number.isFinite(ms) ? `${Math.round(ms).toLocaleString('en-US')}` : '–');

  const restart = (state) => {
    const scenario = state.scenario;
    const sc = SCN[scenario];
    const sch = schedule(state.variant, sc);
    const tracks = tracksFor(scenario);
    const bk = tracks.length > 0 && !sc.noDraw && Number.isFinite(sch.drawStart ?? NaN) ? bake(tracks, state.drawin, scenario) : null;
    const b = tracks.length > 0 ? boundsOf(tracks) : DEFAULT_BOUNDS;
    run = {
      t0: performance.now(),
      frozen: null,
      speed: Number(state.speed) || 1,
      scenario,
      sc,
      sch,
      tracks,
      bk,
      alpha: ALPHA[state.intensity] / 255,
      unlocked: false,
      lang: state.lang,
    };
    for (const root of SHELL.screens()) {
      const d = setupDevice(root);
      d.cam = fit(b, d.dev);
      d.cam0 = scenario === 'first' ? { ...d.cam, s: d.cam.s / 2.5 } : d.cam;
      d.xy = tracks.map((t) => {
        const a = new Float32Array(t.pts.length * 2);
        t.pts.forEach((p, k) => {
          const q = project(d.cam, p);
          a[2 * k] = q[0];
          a[2 * k + 1] = q[1];
        });
        return a;
      });
      d.width = scenario === 'session' ? 3 : clamp(8 * d.cam.s, 1, 2);
      d.paintedFinal = d.cam0 === d.cam;
      paintBase(d.base, d.cam0, W[d.dev], H[d.dev], DPR);
      d.base.classList.remove('is-loaded');
      d.app.classList.remove('is-mounted');
      d.boot.classList.remove('is-gone', 'is-passive');
      d.doneFlags = new Uint8Array(tracks.length);
      d.done.getContext('2d').clearRect(0, 0, d.done.width, d.done.height);
      d.lastT = -Infinity;
      d.grid = null;
      d.highlight = -1;
      d.map.classList.remove('is-pointer');
    }
    const live = document.getElementById('live-timeline');
    if (live) {
      const parts = [`mount ${fmt(sc.mount)}`, `ready ${fmt(sc.ready)}`];
      if (!sc.noLoader) parts.push(`hand-off ${fmt(sch.handoff)}`, `fade ${sch.fade}`);
      if (sc.importAt !== undefined) parts.push(`import done + instant fit ${fmt(sc.importAt)}`);
      if (bk) parts.push(`draw-in ${fmt(sch.drawStart)}–${fmt(sch.drawStart + bk.end)}`, `picking from ${fmt(sch.drawStart + bk.end)}`);
      if (sc.lateAt) parts.push(`cap ${CAP}`, `tracks appear ${fmt(sc.lateAt)}`);
      live.textContent = `${tracks.length} tracks · ${parts.join(' · ')}`;
    }
  };

  const phaseOf = (t) => {
    const sc = run.sc;
    const sch = run.sch;
    if (run.scenario === 'nojs') return 'nojs';
    const drawEnd = run.bk ? sch.drawStart + run.bk.end : null;
    if (sc.noLoader) {
      if (t < sc.importAt) return 'import';
      return t < drawEnd ? 'drawin' : 'done';
    }
    if (t < sch.handoff) return 'loading';
    if (t < sch.handoff + sch.fade) return run.bk && t >= sch.drawStart ? 'both' : 'handoff';
    if (sc.lateAt) return t < sc.lateAt ? 'waiting' : 'late';
    if (drawEnd !== null && t < drawEnd) return 'drawin';
    return 'done';
  };

  const unlockedAt = () => {
    const sc = run.sc;
    const sch = run.sch;
    if (run.scenario === 'nojs') return Infinity;
    if (sc.lateAt) return sc.lateAt;
    if (run.bk) return sch.drawStart + run.bk.end;
    return sch.handoff + sch.fade;
  };

  const drawTracks = (d, t) => {
    const ctx = d.tracks.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, d.tracks.width, d.tracks.height);
    const tracks = run.tracks;
    if (tracks.length === 0) return;
    const sc = run.sc;
    const sch = run.sch;
    const dctx = d.done.getContext('2d');
    const full = (c, i, a, w) => {
      c.strokeStyle = rgba(tracks[i].sport, a);
      c.lineWidth = w;
      const xy = d.xy[i];
      c.beginPath();
      c.moveTo(xy[0], xy[1]);
      for (let k = 2; k < xy.length; k += 2) c.lineTo(xy[k], xy[k + 1]);
      c.stroke();
    };
    const prep = (c) => {
      c.setTransform(DPR, 0, 0, DPR, 0, 0);
      c.globalCompositeOperation = 'lighter';
      c.lineCap = 'round';
      c.lineJoin = 'round';
    };
    prep(ctx);
    if (run.scenario === 'session') {
      if (t >= sc.ready) full(ctx, 0, 1, d.width);
      return;
    }
    let T = -Infinity;
    let all = false;
    if (sc.lateAt) {
      all = t >= sc.lateAt;
    } else if (run.bk) {
      T = t - sch.drawStart;
      all = T >= run.bk.end;
    }
    if (!all && T < 0) return;
    if (T < d.lastT) {
      d.doneFlags.fill(0);
      dctx.setTransform(1, 0, 0, 1, 0, 0);
      dctx.clearRect(0, 0, d.done.width, d.done.height);
    }
    d.lastT = T;
    prep(dctx);
    const baked = run.bk ? run.bk.baked : null;
    const partial = [];
    for (let i = 0; i < tracks.length; i++) {
      if (d.doneFlags[i]) continue;
      const ts = baked ? baked[i] : null;
      if (all || (ts && ts[ts.length - 1] <= T)) {
        full(dctx, i, run.alpha, d.width);
        d.doneFlags[i] = 1;
      } else if (ts && ts[0] <= T) partial.push(i);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(d.done, 0, 0);
    prep(ctx);
    ctx.lineWidth = d.width;
    for (const i of partial) {
      ctx.strokeStyle = rgba(tracks[i].sport, run.alpha);
      strokeUntil(ctx, d.xy[i], baked[i], T);
    }
    if (run.bk && run.bk.comets && T < run.bk.end + TRAIL) {
      ctx.lineWidth = d.width + 1;
      for (let i = 0; i < tracks.length; i++) {
        const ts = baked[i];
        if (T < ts[0] || T > ts[ts.length - 1] + TRAIL) continue;
        strokeHead(ctx, d.xy[i], ts, T, tracks[i].sport);
      }
    }
    if (run.unlocked && d.highlight >= 0) full(ctx, d.highlight, 1, d.width + 1);
  };

  const renderDevice = (d, t) => {
    const sc = run.sc;
    const sch = run.sch;
    d.app.classList.toggle('is-mounted', t >= sc.mount);
    if (run.scenario === 'first' && !d.paintedFinal && t >= sc.importAt) {
      paintBase(d.base, d.cam, W[d.dev], H[d.dev], DPR);
      d.paintedFinal = true;
    }
    d.base.classList.toggle('is-loaded', t >= sc.tiles);
    if (sc.noLoader) {
      d.boot.classList.add('is-gone');
    } else {
      const k = sch.fadeK(t);
      d.boot.classList.toggle('is-gone', k >= 1);
      d.boot.classList.toggle('is-passive', k > 0);
      d.boot.style.opacity = String(1 - k);
      d.boot.style.setProperty('--boot-blur', `${sch.blur ? 8 * (1 - k) : 8}px`);
      d.logo.style.opacity = String(sch.logoOpacity(t));
      d.logo.style.transform = sch.shrink ? `scale(${1 - 0.08 * k})` : '';
      const p = sch.phaseAt(t);
      d.strokes.forEach((s, i) => s.setAttribute('stroke-dashoffset', strokeOffset(i, p).toFixed(4)));
    }
    drawTracks(d, t);
    const L = LABELS[run.lang] || LABELS.en;
    d.ms.textContent = `${fmt(t)} ms`;
    d.phase.textContent = L[phaseOf(t)];
    d.lock.classList.toggle('is-locked', !run.unlocked);
    d.lock.classList.toggle('is-open', run.unlocked);
    d.lockClosed.toggleAttribute('hidden', run.unlocked);
    d.lockOpen.toggleAttribute('hidden', !run.unlocked);
    d.lockText.textContent = run.unlocked ? L.open : L.locked;
  };

  const elapsed = () => {
    if (run.frozen !== null) return run.frozen;
    return (performance.now() - run.t0) * run.speed;
  };

  const frame = () => {
    if (run) {
      const t = elapsed();
      const unlocked = t >= unlockedAt();
      if (!unlocked && run.unlocked) for (const d of Object.values(devices)) d.highlight = -1;
      run.unlocked = unlocked;
      for (const d of Object.values(devices)) renderDevice(d, t);
      stats.frames++;
    }
    requestAnimationFrame(frame);
  };

  // ---------- shell wiring ----------
  const keyOf = (s) => [s.variant, s.drawin, s.scenario, s.intensity, s.speed].join('|');
  let lastKey = null;
  const applyText = (state) => {
    const km = DEMO[0] ? tracksFor('session')[0].len / 1000 : 0;
    for (const root of SHELL.screens()) {
      const name = root.querySelector('.js-session-name');
      const kmEl = root.querySelector('.js-session-km');
      if (name && DEMO[0]) name.textContent = DEMO[0].name;
      if (kmEl) kmEl.textContent = `${km.toLocaleString(state.lang === 'de' ? 'de-DE' : 'en-US', { maximumFractionDigits: 1, minimumFractionDigits: 1 })} km`;
    }
  };
  let booted = false;
  SHELL.onChange((state) => {
    if (!booted) {
      booted = true;
      SHELL.hydrate({ variant: 'B' });
      return;
    }
    if (run) run.lang = state.lang;
    applyText(state);
    const key = keyOf(state);
    if (key !== lastKey) {
      lastKey = key;
      restart(state);
    }
  });
  SHELL.onAction('replay', () => restart(SHELL.state));
  requestAnimationFrame(frame);

  // Verification hooks (mockup only): freeze the clock at t ms, resume, frame counter
  window.__mock = {
    stats,
    freeze: (t) => {
      run.frozen = t;
    },
    resume: () => {
      run.frozen = null;
      run.t0 = performance.now();
    },
    info: () => ({
      handoff: run.sch.handoff,
      fade: run.sch.fade,
      drawStart: run.sch.drawStart,
      drawEnd: run.bk ? run.sch.drawStart + run.bk.end : null,
      unlockedAt: unlockedAt(),
      tracks: run.tracks.length,
    }),
  };
})();
