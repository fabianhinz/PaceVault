/* Shared data + colour logic for every frame. Mirrors:
   - apps/web/src/features/map/zoneColoredPath.ts (smoothing windows, FALLBACK_COLOR, toColor alpha 255)
   - apps/web/src/lib/zoneColors.ts (zoneScale: blend between band mids, clamped)
   - apps/web/src/lib/speedScale.ts (5th/99th percentile, even domain, pace palette)
   - apps/web/src/features/map/trackColors.ts (sport colours, widths, alpha)
   - apps/web/src/lib/trackSmoothing.ts (rollingMean, time-centred window, undefined stays missing) */
(() => {
  const PV = (window.PV = window.PV || {});
  const device = document.documentElement.dataset.device;
  PV.device = device;

  PV.t = (en, de) => (PV.state && PV.state.lang === 'de' ? de : en);

  PV.TRACK = {
    width: { default: 8, highlighted: 12 },
    alpha: { default: 80, highlighted: 255 },
  };
  PV.SPORT_RGB = { running: [74, 222, 128], cycling: [249, 115, 22] };
  PV.FALLBACK = [160, 160, 160, 80];
  PV.SMOOTH = { hr: 5, power: 30, pace: 10, speed: 10, wind: 10, elevation: 20 };
  PV.THRESHOLDS = { maxHr: 188, restHr: 52, ftp: 250, thresholdPace: 280 };

  const HR_DEFS = [
    [0.5, 0.6, '#60a5fa'],
    [0.6, 0.7, '#34d399'],
    [0.7, 0.8, '#fbbf24'],
    [0.8, 0.9, '#f97316'],
    [0.9, 1.0, '#ef4444'],
  ];
  const POWER_DEFS = [
    [0, 0.55, '#94a3b8'],
    [0.55, 0.75, '#60a5fa'],
    [0.75, 0.9, '#34d399'],
    [0.9, 1.05, '#fbbf24'],
    [1.05, 1.2, '#f97316'],
    [1.2, 1.5, '#ef4444'],
    [1.5, Infinity, '#dc2626'],
  ];
  const PACE_DEFS = [
    [1.4, 1.29, '#60a5fa'],
    [1.29, 1.16, '#34d399'],
    [1.16, 1.05, '#fbbf24'],
    [1.05, 0.97, '#f97316'],
    [0.97, 0.86, '#ef4444'],
  ];
  PV.PALETTES = {
    hr: HR_DEFS.map((d) => d[2]),
    power: POWER_DEFS.map((d) => d[2]),
    pace: PACE_DEFS.map((d) => d[2]),
  };

  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const blend = (domain, colors) => {
    const rgb = colors.map(hex);
    return (v) => {
      if (v <= domain[0]) return rgb[0];
      const last = domain.length - 1;
      if (v >= domain[last]) return rgb[last];
      let i = 0;
      while (v > domain[i + 1]) i++;
      const f = (v - domain[i]) / (domain[i + 1] - domain[i]);
      const a = rgb[i];
      const b = rgb[i + 1];
      return [0, 1, 2].map((k) => Math.round(a[k] + (b[k] - a[k]) * f));
    };
  };
  const pctBands = (defs, toValue) =>
    defs
      .map(([lo, hi, color]) => {
        const midHi = Number.isFinite(hi) ? hi : lo + 0.5;
        return { min: toValue(lo), max: toValue(hi), mid: toValue((lo + midHi) / 2), color };
      })
      .sort((a, b) => a.min - b.min);
  const zoneBands = (metric) => {
    const th = PV.THRESHOLDS;
    if (metric === 'hr') return pctBands(HR_DEFS, (p) => th.restHr + (th.maxHr - th.restHr) * p);
    if (metric === 'power') return pctBands(POWER_DEFS, (p) => th.ftp * p);
    return PACE_DEFS.map(([slowPct, fastPct, color]) => {
      const min = (th.thresholdPace * fastPct) / 60;
      const max = (th.thresholdPace * slowPct) / 60;
      return { min, max, mid: (min + max) / 2, color };
    }).sort((a, b) => a.min - b.min);
  };
  PV.zoneScale = (metric) => {
    const bands = zoneBands(metric);
    return blend(
      bands.map((b) => b.mid),
      bands.map((b) => b.color),
    );
  };

  PV.rollingMean = (times, values, windowSec) => {
    const half = windowSec / 2;
    const out = [];
    let start = 0;
    let end = 0;
    let sum = 0;
    let count = 0;
    for (let i = 0; i < times.length; i++) {
      const time = times[i];
      while (end < times.length && times[end] <= time + half) {
        if (values[end] !== null) {
          sum += values[end];
          count++;
        }
        end++;
      }
      while (start < end && times[start] < time - half) {
        if (values[start] !== null) {
          sum -= values[start];
          count--;
        }
        start++;
      }
      out.push(values[i] === null || count === 0 ? null : sum / count);
    }
    return out;
  };

  const percentile = (sorted, f) => {
    const pos = (sorted.length - 1) * f;
    const lo = sorted[Math.floor(pos)];
    const hi = sorted[Math.ceil(pos)];
    return lo + (hi - lo) * (pos - Math.floor(pos));
  };

  /* ---------- session from the scenario ---------- */
  PV.buildSession = (scenario) => {
    const src = scenario === 'flat' ? window.PV_TRACKS.flat : window.PV_TRACKS.ultra;
    const r = src.records;
    const n = r.t.length;
    const noElevation = scenario === 'noelev';
    const nulls = () => r.t.map(() => null);
    const s = {
      name: src.name ?? null,
      date: src.date ?? null,
      subSport: src.subSport ?? null,
      laps: src.laps ?? [],
      sport: src.sport,
      duration: src.duration,
      distance: src.distance,
      elevationGain: noElevation ? null : src.elevationGain,
      avgHr: src.avgHr,
      avgPower: src.avgPower ?? null,
      n,
      t: r.t,
      lng: r.lng,
      lat: r.lat,
      ele: noElevation ? nulls() : r.ele,
      hr: r.hr,
      power: r.power ?? nulls(),
      cadence: r.cadence ?? nulls(),
      speed: r.speed,
      dist: r.dist,
      hasElevation: !noElevation,
    };
    s.hasPower = s.power.some((v) => v !== null);
    s.path2d = s.lng.map((x, i) => [x, s.lat[i]]);
    let w = Infinity;
    let e = -Infinity;
    let so = Infinity;
    let no = -Infinity;
    for (let i = 0; i < n; i++) {
      w = Math.min(w, s.lng[i]);
      e = Math.max(e, s.lng[i]);
      so = Math.min(so, s.lat[i]);
      no = Math.max(no, s.lat[i]);
    }
    s.bounds = [
      [w, so],
      [e, no],
    ];
    s.center = [(w + e) / 2, (so + no) / 2];
    const kx = 111320 * Math.cos((s.center[1] * Math.PI) / 180);
    const ky = 110540;
    // principal axis (bearing of the long axis, degrees clockwise from north)
    let sxx = 0;
    let syy = 0;
    let sxy = 0;
    for (let i = 0; i < n; i++) {
      const x = (s.lng[i] - s.center[0]) * kx;
      const y = (s.lat[i] - s.center[1]) * ky;
      sxx += x * x;
      syy += y * y;
      sxy += x * y;
    }
    const theta = 0.5 * Math.atan2(2 * sxy, sxx - syy);
    s.axisBearing = (90 - (theta * 180) / Math.PI + 360) % 180;
    // smoothed elevation for the grade chart
    s.eleSmooth = PV.rollingMean(s.t, s.ele, PV.SMOOTH.elevation);
    // speed scale
    const moving = s.speed.filter((v) => v > 0).map((v) => v * 3.6).sort((a, b) => a - b);
    s.speedSlow = percentile(moving, 0.05);
    s.speedFast = percentile(moving, 0.99);
    s.avgSpeedKmh = (s.distance / s.duration) * 3.6;
    // device laps → record spans (lapRanges.ts LapSpan: from/to record index), pace per lap
    s.lapSpans = s.laps.map((lap, lapIndex) => {
      const from = PV.indexAtTime(s, lap.start);
      const to = Math.max(from + 1, PV.indexAtTime(s, lap.end));
      let lw = Infinity;
      let le = -Infinity;
      let ls = Infinity;
      let ln = -Infinity;
      for (let i = from; i <= to && i < n; i++) {
        lw = Math.min(lw, s.lng[i]);
        le = Math.max(le, s.lng[i]);
        ls = Math.min(ls, s.lat[i]);
        ln = Math.max(ln, s.lat[i]);
      }
      const secPerKm = lap.distance > 0 ? (lap.end - lap.start) / (lap.distance / 1000) : null;
      return { lapIndex, from, to, start: lap.start, end: lap.end, distance: lap.distance, intensity: lap.intensity, secPerKm, bounds: [[lw, ls], [le, ln]] };
    });
    // lap of every record (lapRanges.ts lapIndexAtRecord), -1 outside every lap
    s.recordLap = new Array(n).fill(-1);
    for (const span of s.lapSpans) for (let i = span.from; i <= span.to && i < n; i++) if (s.recordLap[i] === -1) s.recordLap[i] = span.lapIndex;
    return s;
  };

  /* ---------- per-record colours per Color by mode ---------- */
  PV.colorsFor = (s, mode) => {
    const H = PV.TRACK.alpha.highlighted;
    if (mode === 'sport') return s.t.map(() => [...PV.SPORT_RGB[s.sport], H]);
    let raw;
    let toValue = (v) => v;
    let scale;
    if (mode === 'hr') {
      raw = s.hr;
      scale = PV.zoneScale('hr');
    } else if (mode === 'power') {
      raw = s.power;
      scale = PV.zoneScale('power');
    } else if (mode === 'pace') {
      raw = s.speed;
      toValue = (v) => (v <= 0 ? null : 1000 / v / 60);
      scale = PV.zoneScale('pace');
    } else {
      raw = s.speed;
      toValue = (v) => v * 3.6;
      const steps = PV.PALETTES.pace.length - 1;
      const domain = PV.PALETTES.pace.map((_, i) => s.speedSlow + ((s.speedFast - s.speedSlow) * i) / steps);
      scale = blend(domain, PV.PALETTES.pace);
    }
    const smooth = PV.rollingMean(s.t, raw, PV.SMOOTH[mode]);
    return smooth.map((v) => {
      if (v === null) return PV.FALLBACK;
      const value = toValue(v);
      if (value === null) return PV.FALLBACK;
      return [...scale(value), H];
    });
  };


  /* lap whose span holds record i (lapRanges.ts lapIndexAtRecord); undefined outside every lap */
  PV.lapAtRecord = (s, i) => {
    const span = s.lapSpans.find((x) => i >= x.from && i <= x.to);
    return span ? span.lapIndex : undefined;
  };
  PV.indexAtTime = (s, time) => {
    let lo = 0;
    let hi = s.n - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (s.t[mid] <= time) lo = mid;
      else hi = mid;
    }
    return time - s.t[lo] < s.t[hi] - time ? lo : hi;
  };

  /* ---------- formatting (apps/web/src/lib/formatters.ts, chartTheme.ts) ---------- */
  PV.locale = () => (PV.state && PV.state.lang === 'de' ? 'de-DE' : 'en-US');
  PV.fmtDuration = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };
  PV.fmtDistance = (m) => {
    if (m === null || m === undefined) return '--';
    const num = new Intl.NumberFormat(PV.locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    if (m >= 1000) return `${num.format(m / 1000)} km`;
    return `${Math.round(m)} m`;
  };
  PV.fmtChartTime = (sec) => {
    const total = Math.round(sec);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  };
  PV.fmtInt = (v) => (v === null || v === undefined ? '--' : new Intl.NumberFormat(PV.locale()).format(Math.round(v)));
  PV.fmt1 = (v) =>
    v === null || v === undefined
      ? '--'
      : new Intl.NumberFormat(PV.locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(v);
  PV.fmtSigned1 = (v) =>
    v === null || v === undefined
      ? '--'
      : new Intl.NumberFormat(PV.locale(), {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
          signDisplay: 'exceptZero',
        }).format(v);
  PV.fmtPace = (minPerKm) => {
    if (minPerKm === null || !Number.isFinite(minPerKm)) return '--';
    const total = Math.round(minPerKm * 60);
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
  };

  /* lucide-react 0.563.0 icon nodes (node_modules/.pnpm/lucide-react@0.563.0…/dist/esm/icons) */
  PV.ICONS = {
    layers:
      '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    chevronRight: '<path d="m9 18 6-6-6-6"/>',
    chevronLeft: '<path d="m15 18-6-6 6-6"/>',
    box: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
    flag: '<path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528"/>',
    rotate3d:
      '<path d="M16.466 7.5C15.643 4.237 13.952 2 12 2 9.239 2 7 6.477 7 12s2.239 10 5 10c.342 0 .677-.069 1-.2"/><path d="m15.194 13.707 3.814 1.86-1.86 3.814"/><path d="M19 15.57c-1.804.885-4.274 1.43-7 1.43-5.523 0-10-2.239-10-5s4.477-5 10-5c4.838 0 8.873 1.718 9.8 4"/>',
    play: '<path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/>',
    pause: '<rect x="14" y="3" width="5" height="18" rx="1"/><rect x="5" y="3" width="5" height="18" rx="1"/>',
    heart:
      '<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/>',
    zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
    gauge: '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
    mountain: '<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>',
    trendingUp: '<path d="M16 7h6v6"/><path d="m22 7-8.5 8.5-5-5L2 17"/>',
    timer: '<line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/>',
    dashboard:
      '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
    flask:
      '<path d="M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2"/><path d="M6.453 15h11.094"/><path d="M8.5 2h7"/>',
    settings:
      '<path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/><circle cx="12" cy="12" r="3"/>',
    funnel:
      '<path d="M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z"/>',
    locate:
      '<line x1="2" x2="5" y1="12" y2="12"/><line x1="19" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="5"/><line x1="12" x2="12" y1="19" y2="22"/><circle cx="12" cy="12" r="7"/>',
    bike: '<circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>',
    footprints:
      '<path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z"/><path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z"/><path d="M16 17h4"/><path d="M4 13h4"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    ellipsis: '<circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>',
    cloudSun:
      '<path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M20 12h2"/><path d="m19.07 4.93-1.41 1.41"/><path d="M15.947 12.65a4 4 0 0 0-5.925-4.128"/><path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z"/>',
    chartCol: '<path d="M5 21v-6"/><path d="M12 21V3"/><path d="M19 21V9"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  };
  PV.icon = (name, size, extra) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${(extra && extra.sw) || 2}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="${(extra && extra.cls) || ''}"${extra && extra.color ? ` style="color:${extra.color}"` : ''}>${PV.ICONS[name]}</svg>`;
})();
