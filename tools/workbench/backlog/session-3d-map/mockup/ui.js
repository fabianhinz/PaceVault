/* Page chrome: dock, session header, summary card with the laps row, charts card (cursor = map
   dot), map pills (Color by, Laps / lap stepper, 3D), 3D popover / drawer. */
(() => {
  const PV = window.PV;
  const $ = (sel) => document.querySelector(sel);
  const t = (en, de) => PV.t(en, de);
  const desktop = () => PV.device === 'desktop';

  /* ---------- dock (Dock.tsx, DockItems.tsx: tabs Dashboard · Sessions · Labs · Settings) ---------- */
  const tabIcons = ['dashboard', 'zap', 'flask', 'settings'];
  const tabLabels = () => [t('Dashboard', 'Dashboard'), t('Sessions', 'Einheiten'), t('Labs', 'Labs'), t('Settings', 'Einstellungen')];
  const renderDock = () => {
    const labels = tabLabels();
    const tabs = tabIcons
      .map(
        (ic, i) =>
          `<span class="dock-btn${i === 1 ? ' is-active' : ''}" aria-label="${labels[i]}">${PV.icon(ic, 20, { sw: 1.5 })}</span>`,
      )
      .join('');
    if (desktop()) {
      return `<nav class="dock-rail" data-layout="dock"><div class="dock-seg floating">${tabs}</div><div class="dock-seg floating"><span class="dock-btn">${PV.icon('funnel', 20, { sw: 1.5 })}</span><span class="dock-btn">${PV.icon('locate', 20, { sw: 1.5 })}</span></div></nav>`;
    }
    return `<nav class="dock-bar" data-layout="dock"><div class="dock-circle floating"><span class="dock-btn">${PV.icon('locate', 20, { sw: 1.5 })}</span></div><div class="dock-seg dock-tabs floating">${tabs}</div><div class="dock-circle floating"><span class="dock-btn">${PV.icon('funnel', 20, { sw: 1.5 })}</span></div></nav>`;
  };

  /* ---------- content ---------- */
  const sessionDate = (s) =>
    new Intl.DateTimeFormat(PV.locale(), { month: 'short', day: 'numeric', year: 'numeric' }).format(
      new Date(s.date ?? Date.UTC(2026, 9, 11, 6, 40)),
    );
  // sessionTitleFormatter.ts: the file's name when it has one, else "<time of day> <sport>"
  const sessionTitle = (s) => {
    if (s.name) return s.name;
    return s.sport === 'cycling' ? t('Morning Ride', 'Fahrt am Morgen') : t('Morning Run', 'Lauf am Morgen');
  };
  // formatSessionZoneLabel: % of HR reserve against the HR_ZONE_DEFS lower bounds
  const ZONES = [
    [0.9, 'VO2max', 'VO2max'],
    [0.8, 'Threshold', 'Schwelle'],
    [0.7, 'Tempo', 'Tempo'],
    [0.6, 'Aerobic', 'Aerob'],
    [0.5, 'Recovery', 'Erholung'],
  ];
  const zoneLabel = (s) => {
    const th = PV.THRESHOLDS;
    const pct = (s.avgHr - th.restHr) / (th.maxHr - th.restHr);
    const z = ZONES.find((x) => pct >= x[0]);
    return z ? t(z[1], z[2]) : null;
  };
  const subtitle = (s) => {
    const parts = [sessionDate(s)];
    if (s.subSport && s.subSport !== 'generic') parts.push(s.subSport.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()));
    const z = zoneLabel(s);
    if (z) parts.push(z);
    parts.push(PV.fmtDistance(s.distance), PV.fmtDuration(s.duration));
    return parts.join(' · ');
  };

  const header = (s) => `
    <div class="sh">
      <div class="sh__left">
        <div class="sport-badge sport-badge--${s.sport}">${PV.icon(s.sport === 'cycling' ? 'bike' : 'footprints', 18)}</div>
        <div class="min0">
          <h1 class="t-h2 truncate">${sessionTitle(s)}</h1>
          <p class="t-caption truncate">${subtitle(s)}</p>
        </div>
      </div>
      <button type="button" class="btn-ghost-icon" aria-label="${t('Session actions', 'Aktionen')}">${PV.icon('ellipsis', 20)}</button>
    </div>`;

  const cli = (avatar, primary, secondary) => `
    <button type="button" class="cli">
      <span class="lih"><span class="lih__avatar">${avatar}</span><span class="min0"><span class="t-body1 block">${primary}</span><span class="t-caption block">${secondary}</span></span></span>
      <span class="cli__chev">${PV.icon('chevronRight', 16)}</span>
    </button>`;

  const summary = (s) => {
    const weather = cli(
      PV.icon('cloudSun', 20),
      t('Partly cloudy 9–14 °C', 'Teilweise bewölkt 9–14 °C'),
      t('Wind 11 km/h W · 38 % headwind', 'Wind 11 km/h W · 38 % Gegenwind'),
    );
    const te = cli(
      PV.icon('gauge', 24, { cls: 'c-tertiary' }),
      t('Improving · Maintaining', 'Verbessernd · Erhaltend'),
      t('Aerobic 3.4 · Anaerobic 1.2', 'Aerob 3,4 · Anaerob 1,2'),
    );
    const topics = s.hasPower
        ? t('Load · Calories · Power · Zones', 'Last · Kalorien · Leistung · Zonen')
        : t('Load · Calories · Zones', 'Last · Kalorien · Zonen');
    const more = cli(PV.icon('chartCol', 20), t('More stats', 'Weitere Werte'), topics);
    const laps = s.laps.length === 0 ? '' : lapsRow(s);
    return `<div class="summary glass" data-testid="session-summary">${weather}${te}${laps}${more}</div>`;
  };

  /* ---------- LapsRow + LapStrip (LapsRow.tsx, LapStrip.tsx): bars = lap pace vs session average ---------- */
  const STRIP_W = 300;
  const STRIP_H = 64;
  const stripLayout = (s) => {
    const total = s.t[s.n - 1] || 1;
    const avg = s.duration / (s.distance / 1000);
    const devs = s.lapSpans.map((l) => (l.secPerKm === null ? 0 : l.secPerKm - avg));
    const maxDev = Math.max(1, ...devs.map(Math.abs));
    return s.lapSpans.map((l, i) => ({
      lapIndex: l.lapIndex,
      x: (l.start / total) * STRIP_W,
      width: Math.max(0.5, ((l.end - l.start) / total) * STRIP_W),
      dev: devs[i] / maxDev,
    }));
  };
  const stripSvg = (s, w, h, interactive) => {
    const sx = w / STRIP_W;
    const mid = h / 2;
    const bars = stripLayout(s)
      .map((b) => {
        const len = Math.abs(b.dev) * (mid - 2);
        const y = b.dev < 0 ? mid - len : mid;
        const color = b.dev < 0 ? '#06b6d4' : '#f59e0b'; // tokens.chartPace (faster) / chartCadence (slower)
        const sel = PV.lap.selected === b.lapIndex;
        const hov = PV.lap.hovered === b.lapIndex && !sel;
        let extra = '';
        if (interactive && hov) extra += `<rect x="${b.x * sx}" y="0" width="${b.width * sx}" height="${h}" fill="#fff" fill-opacity="0.1"/>`;
        if (interactive && sel)
          extra += `<rect x="${b.x * sx + 0.75}" y="0.75" width="${Math.max(0.5, b.width * sx - 1.5)}" height="${h - 1.5}" rx="2" fill="#fff" fill-opacity="0.06" stroke="#fff" stroke-width="1.5"/>`;
        const hit = interactive ? `<rect data-lap-bar="${b.lapIndex}" x="${b.x * sx}" y="0" width="${b.width * sx}" height="${h}" fill="transparent" style="cursor:pointer"/>` : '';
        return `<rect x="${b.x * sx + 0.25}" y="${y}" width="${Math.max(0.5, b.width * sx - 0.5)}" height="${Math.max(1, len)}" fill="${color}"/>${extra}${hit}`;
      })
      .join('');
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" class="lap-strip__svg" style="width:100%;height:${h}px"><line x1="0" x2="${w}" y1="${mid}" y2="${mid}" stroke="rgba(255,255,255,.25)" stroke-dasharray="2 3"/>${bars}</svg>`;
  };
  const lapsRow = (s) => `
    <div class="cli-wrap laps-row${PV.lapsRowOpen ? ' is-open' : ''}">
      <button type="button" class="cli js-laps-row">
        <span class="lih"><span class="lih__avatar lap-avatar">${stripSvg(s, 30, 30, false)}</span><span class="min0"><span class="t-body1 block">${lapsLabel(s)}</span></span></span>
        <span class="cli__chev">${PV.icon('chevronRight', 16)}</span>
      </button>
      <div class="laps-row__detail">
        <div class="lap-strip" data-testid="lap-strip">${stripSvg(s, STRIP_W, STRIP_H, true)}
          <div class="lap-strip__ends t-caption c-tertiary tnum"><span>1</span><span>${s.lapSpans.length}</span></div>
          <div class="lap-strip__legend t-caption c-tertiary"><span><i style="background:#06b6d4"></i>${t('faster than avg', 'schneller als Ø')}</span><span><i style="background:#f59e0b"></i>${t('slower', 'langsamer')}</span></div>
        </div>
      </div>
    </div>`;
  PV.paintLapStrip = () => {
    PV.paintLapBands();
    const s = PV.session;
    const el = document.querySelector('.lap-strip > svg');
    if (!el || !s) return;
    el.outerHTML = stripSvg(s, STRIP_W, STRIP_H, true);
    for (const r of document.querySelectorAll('[data-lap-bar]')) {
      const i = Number(r.dataset.lapBar);
      r.onclick = () => setTimeout(() => PV.selectLap(PV.lap.selected === i ? null : i), 0);
      r.onpointerenter = () => PV.hoverLap(i);
      r.onpointerleave = () => PV.hoverLap(null);
    }
  };

  /* ---------- charts (SessionChartsExplorer.tsx: HR, Power, Speed, Pace, Elevation, Grade) ---------- */
  const CHART_COLORS = {
    hr: '#ef4444',
    cadence: '#f59e0b',
    power: '#3b82f6',
    speed: '#22c55e',
    pace: '#06b6d4',
    elevation: '#8b5cf6',
    grade: '#a78bfa',
  };
  const chartDefs = (s) => {
    const rows = [
      { key: 'hr', title: t('Heart Rate', 'Herzfrequenz'), icon: 'heart', unit: 'bpm', get: (i) => s.hr[i], fmt: PV.fmtInt, rest: 'avgmax' },
    ];
    if (s.hasPower)
      rows.push({ key: 'power', title: t('Power', 'Leistung'), icon: 'zap', unit: 'W', get: (i) => s.powerSmooth[i], fmt: PV.fmtInt, rest: 'avgmax' });
    rows.push({ key: 'speed', title: t('Speed', 'Geschwindigkeit'), icon: 'gauge', unit: 'km/h', get: (i) => s.speed[i] * 3.6, fmt: PV.fmt1, rest: 'avgmax' });
    if (s.sport === 'running')
      rows.push({
        key: 'pace',
        title: t('Pace', 'Tempo'),
        icon: 'timer',
        unit: '/km',
        get: (i) => (s.speedSmooth[i] > 0.5 ? 1000 / s.speedSmooth[i] / 60 : null),
        fmt: PV.fmtPace,
        rest: 'avgbest',
        invert: true,
      });
    rows.push({
      key: 'elevation',
      title: t('Elevation', 'Höhenmeter'),
      icon: 'mountain',
      unit: 'm',
      get: (i) => s.ele[i],
      fmt: PV.fmtInt,
      rest: 'gain',
      area: true,
    });
    rows.push({ key: 'grade', title: t('Grade', 'Steigung'), icon: 'trendingUp', unit: '%', get: (i) => s.grade[i], fmt: PV.fmtSigned1, rest: 'maxmin' });
    // cadence.ts stepsPerMinute: running stride cadence × 2
    const spm = s.sport === 'running' ? 2 : 1;
    rows.push({
      key: 'cadence',
      title: t('Cadence', 'Kadenz'),
      icon: s.sport === 'running' ? 'footprints' : 'bike',
      unit: s.sport === 'running' ? 'spm' : 'rpm',
      get: (i) => (s.cadenceSmooth[i] === null ? null : s.cadenceSmooth[i] * spm),
      fmt: PV.fmtInt,
      rest: 'avgmax',
    });
    return rows.filter((row) => s.t.some((_, i) => row.get(i) !== null));
  };

  const prepareSeries = (s) => {
    s.powerSmooth = PV.rollingMean(s.t, s.power, 10);
    s.cadenceSmooth = PV.rollingMean(s.t, s.cadence, 10);
    s.speedSmooth = PV.rollingMean(s.t, s.speed, 10);
    s.grade = s.t.map((_, i) => {
      const a = Math.max(0, i - 10);
      const b = Math.min(s.n - 1, i + 10);
      if (s.eleSmooth[a] === null || s.eleSmooth[b] === null) return null;
      const d = s.dist[b] - s.dist[a];
      if (d < 20) return 0;
      return ((s.eleSmooth[b] - s.eleSmooth[a]) / d) * 100;
    });
  };

  const stats = (s, row) => {
    const vals = s.t.map((_, i) => row.get(i)).filter((v) => v !== null);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    return { avg, max: Math.max(...vals), min: Math.min(...vals) };
  };

  const restReading = (s, row) => {
    const st = stats(s, row);
    if (row.rest === 'gain')
      return { header: t('gain', 'Anstieg'), value: PV.fmtInt(s.elevationGain), secondary: `${t('max', 'max')} ${PV.fmtInt(st.max)}` };
    if (row.rest === 'maxmin')
      return { header: t('max', 'max'), value: row.fmt(st.max), secondary: `${t('min', 'min')} ${row.fmt(st.min)}` };
    if (row.rest === 'avgbest')
      return { header: t('avg', 'Ø'), value: PV.fmtPace(1000 / (s.distance / s.duration) / 60), secondary: `${t('best', 'beste')} ${row.fmt(st.min)}` };
    return { header: t('avg', 'Ø'), value: row.fmt(st.avg), secondary: `${t('max', 'max')} ${row.fmt(st.max)}` };
  };

  const CH = { top: 6, bottom: 22, left: 36 }; // compactYAxisWidth 36, x ticks below
  const LAP_STRIP_TICK_MARGIN = 12; // LapBands.tsx: x-axis ticks move down to make room for the strip
  const buildChartSvg = (s, row, width, height) => {
    const step = Math.max(1, Math.floor(s.n / Math.max(200, width)));
    const pts = [];
    for (let i = 0; i < s.n; i += step) pts.push([s.t[i], row.get(i)]);
    const vals = pts.map((p) => p[1]).filter((v) => v !== null);
    let lo = Math.min(...vals);
    let hi = Math.max(...vals);
    if (hi === lo) hi = lo + 1;
    const pad = (hi - lo) * 0.08;
    lo -= pad;
    hi += pad;
    const x0 = CH.left;
    const x1 = width;
    const y0 = CH.top;
    const y1 = height - CH.bottom - (s.lapSpans.length ? LAP_STRIP_TICK_MARGIN : 0);
    const tMax = s.t[s.n - 1];
    const sx = (tv) => x0 + ((x1 - x0) * tv) / tMax;
    let sy = (v) => y1 - ((y1 - y0) * (v - lo)) / (hi - lo);
    if (row.invert) sy = (v) => y0 + ((y1 - y0) * (v - lo)) / (hi - lo);
    let d = '';
    let pen = false;
    for (const [tv, v] of pts) {
      if (v === null) {
        pen = false;
        continue;
      }
      d += `${pen ? 'L' : 'M'}${sx(tv).toFixed(1)},${sy(v).toFixed(1)}`;
      pen = true;
    }
    const color = CHART_COLORS[row.key];
    let area = '';
    if (row.area) area = `<path d="${d}L${x1},${y1}L${x0},${y1}Z" fill="${color}" fill-opacity="0.2" stroke="none"/>`;
    const ticks = [lo + pad, (lo + hi) / 2, hi - pad]
      .map((v) => `<text x="${x0 - 6}" y="${sy(v) + 4}" text-anchor="end">${row.key === 'pace' ? PV.fmtPace(v) : Math.round(v)}</text>`)
      .join('');
    return {
      svg: `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
        <line x1="${x0}" x2="${x1}" y1="${y1}" y2="${y1}" stroke="#252830"/>
        ${ticks}
        <text x="${x0}" y="${height - 4}">${PV.fmtChartTime(0)}</text>
        <text x="${x1}" y="${height - 4}" text-anchor="end">${PV.fmtChartTime(tMax)}</text>
        <g class="lap-bands"></g>${area}<path d="${d}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linejoin="round"/>
        <g class="cursor" visibility="hidden"><line y1="${y0}" y2="${y1}" stroke="#ccc" stroke-width="1"/><circle r="4" fill="${color}" stroke="#fff" stroke-width="2"/></g>
      </svg>`,
      sx,
      sy,
      x0,
      x1,
      y0,
      y1,
      tMax,
    };
  };

  /* LapBands.tsx: per lap a hover wash and a selected outline over the plot, and a 4 px strip
     3 px below it (alternating .32/.22 white, .1 for non-active laps, .6 hovered, .95 selected) */
  const STRIP_OFFSET = 3;
  const STRIP_HEIGHT = 4;
  const stripFill = (lap, i) => {
    if (PV.lap.selected === i) return 'rgba(255,255,255,.95)';
    if (PV.lap.hovered === i) return 'rgba(255,255,255,.6)';
    if (lap.intensity && lap.intensity !== 'active') return 'rgba(255,255,255,.1)';
    if (i % 2 === 1) return 'rgba(255,255,255,.22)';
    return 'rgba(255,255,255,.32)';
  };
  PV.paintLapBands = () => {
    const s = PV.session;
    if (!PV.chartViews || !s) return;
    for (const v of PV.chartViews) {
      const g = v.el.querySelector('.lap-bands');
      if (!g) continue;
      const b = v.built;
      const h = b.y1 - b.y0;
      g.innerHTML = s.lapSpans
        .map((lap, i) => {
          const x = b.sx(s.t[lap.from]);
          const width = Math.max(0.5, b.sx(s.t[lap.to]) - x);
          const gap = width > 3 ? 1 : 0.3;
          let out = '';
          if (PV.lap.hovered === i && PV.lap.selected !== i) out += `<rect x="${x}" y="${b.y0}" width="${width}" height="${h}" fill="rgba(255,255,255,.1)"/>`;
          if (PV.lap.selected === i)
            out += `<rect x="${x}" y="${b.y0 + 0.75}" width="${width}" height="${Math.max(0, h - 1.5)}" rx="2" fill="#fff" fill-opacity="0.06" stroke="#fff" stroke-width="1.5"/>`;
          out += `<rect x="${x + gap / 2}" y="${b.y1 + STRIP_OFFSET}" width="${Math.max(0.4, width - gap)}" height="${STRIP_HEIGHT}" rx="1" fill="${stripFill(lap, i)}"/>`;
          return out;
        })
        .join('');
    }
  };

  const renderCharts = (s) => {
    const rows = chartDefs(s);
    PV.chartRows = rows;
    return `<div class="charts glass">${rows
      .map(
        (row) => `
      <section class="crow" data-key="${row.key}">
        <div class="crow__head">${PV.icon(row.icon, 16, { color: CHART_COLORS[row.key] })}<h4 class="t-title">${row.title}</h4><span class="c-tertiary" style="display:inline-flex">${PV.icon('info', 14)}</span></div>
        <div class="crow__body"><div class="crow__grid">
          <div class="rail"><div></div><div class="rail__mid"><p class="t-overline tnum truncate rail__head"></p><p class="t-h3 tnum truncate rail__val"><span class="rail__num"></span><span class="t-caption rail__unit">${row.unit}</span></p><p class="t-caption c-tertiary tnum truncate rail__sec"></p></div><div></div></div>
          <div class="chart"></div>
        </div></div>
      </section>`,
      )
      .join('')}</div>`;
  };

  const mountCharts = (s) => {
    PV.chartViews = [];
    for (const row of PV.chartRows) {
      const el = document.querySelector(`.crow[data-key="${row.key}"] .chart`);
      const w = Math.round(el.clientWidth) || 300;
      const h = Math.round(el.clientHeight) || 140;
      const built = buildChartSvg(s, row, w, h);
      el.innerHTML = built.svg;
      PV.chartViews.push({ row, el, built, section: el.closest('.crow') });
      const toTime = (clientX) => {
        const r = el.getBoundingClientRect();
        const x = ((clientX - r.left) / r.width) * w;
        return Math.max(0, Math.min(built.tMax, ((x - built.x0) / (built.x1 - built.x0)) * built.tMax));
      };
      el.addEventListener('pointermove', (e) => PV.scrub(toTime(e.clientX)));
      el.addEventListener('pointerdown', (e) => PV.scrub(toTime(e.clientX)));
      el.addEventListener('pointerleave', () => PV.scrubEnd());
      // SessionChartsExplorer onSelectTime: a chart click toggles the lap at that time
      el.addEventListener('click', (e) => {
        const lap = PV.lapAtRecord(s, PV.indexAtTime(s, toTime(e.clientX)));
        if (lap === undefined) return;
        setTimeout(() => PV.selectLap(PV.lap.selected === lap ? null : lap), 0);
      });
    }
    PV.paintLapBands();
    PV.paintCursor();
  };

  /* cursor → rails + chart cursors (SeriesRail: header = time while active, else rest header) */
  PV.paintCursor = () => {
    const s = PV.session;
    if (!s || !PV.chartViews) return;
    const time = PV.cursorTime;
    const idx = time === null ? null : PV.indexAtTime(s, time);
    for (const v of PV.chartViews) {
      const g = v.el.querySelector('.cursor');
      const sec = v.section;
      let head;
      let val;
      let second;
      const rest = restReading(s, v.row);
      if (idx === null) {
        g.setAttribute('visibility', 'hidden');
        head = rest.header;
        val = rest.value;
        second = rest.secondary;
        sec.querySelector('.rail__head').classList.remove('c-primary');
      } else {
        const value = v.row.get(idx);
        const x = v.built.sx(s.t[idx]);
        g.setAttribute('visibility', 'visible');
        g.querySelector('line').setAttribute('x1', x);
        g.querySelector('line').setAttribute('x2', x);
        const c = g.querySelector('circle');
        c.setAttribute('cx', x);
        c.setAttribute('cy', value === null ? -99 : v.built.sy(value));
        head = PV.fmtChartTime(s.t[idx]);
        val = v.row.fmt(value);
        second = `${rest.header} ${rest.value}`;
        sec.querySelector('.rail__head').classList.add('c-primary');
      }
      sec.querySelector('.rail__head').textContent = head;
      sec.querySelector('.rail__num').textContent = val;
      sec.querySelector('.rail__sec').textContent = second;
    }
  };

  /* ---------- pills ---------- */
  const COLOR_BY_PILL = {
    sport: () => t('Color by', 'Färben nach'),
    hr: () => t('HR zones', 'HF-Zonen'),
    power: () => t('Power zones', 'Leistungszonen'),
    pace: () => t('Pace zones', 'Pace-Zonen'),
    speed: () => t('Speed', 'Geschw.'),
  };
  const swatchBg = (mode) => {
    if (mode === 'speed' || mode === 'pace') return `linear-gradient(to right, ${PV.PALETTES.pace.join(', ')})`;
    return `linear-gradient(to right, ${PV.PALETTES[mode].join(', ')})`;
  };

  /* availability of 3D (Q7: offline / DEM tiles not cached) */
  PV.availability = (st) => {
    // Q7 (a): disabled with the reason, like Color by's unavailable modes (colorModes.ts:80)
    if (st.scenario === 'offline') return { ok: false, reason: t('No terrain data', 'Keine Geländedaten') };
    return { ok: true, reason: '' };
  };
  PV.is3d = (st) => st.mode3d === 'on' && PV.availability(st).ok;

  /* Map view control (Q36), built like ColorByControl.tsx: FloatingPill h-11 with the CURRENT mode */
  const mapViewPill = (st) => {
    const on = PV.is3d(st);
    return `<span class="pill-wrap"><button type="button" class="pill floating" id="pill3d" aria-haspopup="dialog">${PV.icon('box', 16)}<span>${on ? '3D' : '2D'}</span><span class="pill__chev">${PV.icon('chevronDown', 14)}</span></button></span>`;
  };
  // LapsControl.tsx pillLabel: device laps "{count} device laps" (lapLabels.ts:31-42) with LapSwatch
  const lapsLabel = (s) => {
    if (s.laps.length === 0) return t('Laps', 'Runden');
    return t(`${s.laps.length} device laps`, `${s.laps.length} Geräterunden`);
  };
  // LapStrip.tsx LapSwatch / cellColor: one cell per lap, alternating .75/.5 white for active laps
  const lapSwatch = (s) => {
    if (s.laps.length === 0) return '';
    const cell = (lap, i) => {
      if (lap.intensity && lap.intensity !== 'active') return 'rgba(255,255,255,.18)';
      return i % 2 === 0 ? 'rgba(255,255,255,.75)' : 'rgba(255,255,255,.5)';
    };
    const cells = s.laps.map((lap, i) => `<i style="flex:${Math.max(1, lap.end - lap.start)} 1 0;background:${cell(lap, i)}"></i>`).join('');
    return `<span class="swatch swatch--laps" aria-hidden="true">${cells}</span>`;
  };
  const renderPills = (st) => {
    const mode = st.colorBy;
    const swatch = mode === 'sport' ? '' : `<span class="swatch" style="background:${swatchBg(mode)}"></span>`;
    const sel = PV.lap.selected;
    let colorBy = `<button type="button" class="pill floating">${PV.icon('layers', 16)}<span>${COLOR_BY_PILL[mode]()}</span>${swatch}<span class="pill__chev">${PV.icon('chevronDown', 14)}</span></button>`;
    let laps = `<button type="button" class="pill floating">${PV.icon('flag', 16)}<span>${lapsLabel(PV.session)}</span>${lapSwatch(PV.session)}<span class="pill__chev">${PV.icon('chevronDown', 14)}</span></button>`;
    if (sel !== null) {
      const last = PV.session.lapSpans.length - 1;
      colorBy = `<button type="button" class="pill floating pill--icon" aria-label="${t('Color by', 'Färben nach')}">${PV.icon('layers', 16)}</button>`;
      laps = `<div role="group" class="pill floating lap-stepper" data-testid="lap-stepper">${PV.icon('flag', 16)}<button type="button" class="step-btn" data-lap-step="-1" aria-label="${t('Previous lap', 'Vorherige Runde')}"${sel === 0 ? ' disabled' : ''}><span>${PV.icon('chevronLeft', 16)}</span></button><span class="lap-stepper__name tnum">${t(`Lap ${sel + 1}`, `Runde ${sel + 1}`)}</span><button type="button" class="step-btn" data-lap-step="1" aria-label="${t('Next lap', 'Nächste Runde')}"${sel === last ? ' disabled' : ''}><span>${PV.icon('chevronRight', 16)}</span></button></div><button type="button" class="pill floating pill--icon js-lap-clear lap-clear" aria-label="${t('Clear lap', 'Runde abwählen')}">${PV.icon('x', 16)}</button>`;
    }
    return `<div class="pills" data-testid="map-pills">
      ${colorBy}
      ${laps}
      ${mapViewPill(st)}
    </div>`;
  };

  /* ---------- Map view popover (desktop Popover, phone Dialog drawer: ResponsivePopover.tsx) ----------
     ColorByControl.tsx: caption header (desktop only), RadioGroup gap-1, items rounded-lg px-2 py-2
     with label + one line of copy; an unavailable item is disabled and shows its reason (Q7) */
  const MAP_VIEWS = () => [
    { id: 'off', title: '2D', desc: t('Flat map', 'Flache Karte') },
    { id: 'on', title: '3D', desc: t('Terrain from Mapterhorn', 'Gelände von Mapterhorn') },
  ];
  const renderPopover = (st) => {
    const av = PV.availability(st);
    const current = PV.is3d(st) ? 'on' : 'off';
    const rows = MAP_VIEWS()
      .map((v) => {
        const disabled = v.id === 'on' && !av.ok;
        const desc = disabled ? av.reason : v.desc;
        return `<button type="button" role="radio" aria-checked="${current === v.id}" class="radio${current === v.id ? ' is-checked' : ''}" data-map-view="${v.id}"${disabled ? ' disabled' : ''}><span class="radio__dot"></span><span class="min0" style="flex:1"><span class="t-subtitle1 block">${v.title}</span><span class="t-caption c-tertiary block">${desc}</span></span></button>`;
      })
      .join('');
    const title = t('Map view', 'Kartenansicht');
    if (desktop()) {
      return `<div class="pop floating" id="pop3d"><div class="pop__head">${PV.icon('box', 14)}<span class="t-caption">${title}</span></div><div class="radio-group" role="radiogroup">${rows}</div></div>`;
    }
    return `<div class="scrim" id="popScrim"></div><div class="pop floating" id="pop3d"><div class="pop__dlg-head">${PV.icon('box', 16)}<h2 class="t-title">${title}</h2></div><div class="pop__body"><div class="radio-group" role="radiogroup">${rows}</div></div></div>`;
  };

  /* ---------- render ---------- */
  PV.renderUi = (st) => {
    const s = PV.session;
    const loading = st.scenario === 'loading';
    $('#dock').innerHTML = renderDock();
    let content = '';
    if (!loading) prepareSeries(s);
    if (!loading) content = `<div class="stack">${header(s)}${summary(s)}${renderCharts(s)}</div>`;
    const main = $('#main');
    if (desktop()) {
      main.className = 'main';
      main.setAttribute('data-layout', 'main');
      main.innerHTML = content;
    } else {
      main.className = 'main glass';
      main.innerHTML = `<div class="sheet-handle"><span class="sheet-grabber"></span></div><div class="sheet-scroll" data-layout="main">${content}</div>`;
    }
    $('#pills').innerHTML = loading ? '' : renderPills(st);
    $('#popHost').innerHTML = !loading && st.popover === 'on' ? renderPopover(st) : '';
    $('#mapPins').innerHTML = loading ? '' : [].map((q) => `<span data-q="${q}"></span>`).join('');
    PV.renderBadges();
    if (!loading) mountCharts(s);
    wire(st);
  };

  /* badges: the shell paints [data-q] once at load; dynamic markup reuses its badge look */
  PV.renderBadges = () => {
    for (const el of document.querySelectorAll('[data-q]')) {
      const id = el.dataset.q;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ms-q';
      b.dataset.qid = id;
      b.textContent = id;
      const st = PV.questionState ? PV.questionState(id) : undefined;
      if (st) b.classList.add(`ms-q--${st}`);
      else {
        b.style.background = 'var(--wb-tile-bg)';
        b.style.color = 'var(--color-text-secondary)';
      }
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        const host = parent.document.querySelector(`.ms-panel [data-qid="${id}"]`);
        if (host) host.click();
      });
      el.replaceWith(b);
    }
  };

  const wire = (st) => {
    const p3 = $('#pill3d');
    // state changes re-render both frames; defer them so no click lands on the freshly rendered markup
    const later = (fn) => (e) => {
      e.stopPropagation();
      setTimeout(fn, 0);
    };
    // one-way state: in-frame interactions change this frame only (PV.setLocal), never the toolbar
    if (p3) p3.onclick = later(() => PV.setLocal({ popover: st.popover === 'on' ? 'off' : 'on' }));
    // [data-map-view], never an extra's name: the shell writes data-<extra> on the frame's <html>
    for (const b of document.querySelectorAll('[data-map-view]')) {
      b.onclick = later(() => PV.setLocal({ mode3d: b.dataset.mapView, popover: 'off' })); // ColorByControl: setOpen(false)
    }
    const scrim = $('#popScrim');
    if (scrim) scrim.onclick = later(() => PV.setLocal({ popover: 'off' }));
    for (const b of document.querySelectorAll('[data-lap-step]'))
      b.onclick = later(() => PV.selectLap(PV.lap.selected + Number(b.dataset.lapStep)));
    for (const b of document.querySelectorAll('.js-lap-clear')) b.onclick = later(() => PV.selectLap(null));
    // CollapsibleListItem keeps its open state across re-renders
    for (const b of document.querySelectorAll('.js-laps-row'))
      b.onclick = () => {
        PV.lapsRowOpen = !PV.lapsRowOpen;
        b.parentElement.classList.toggle('is-open', PV.lapsRowOpen);
      };
    for (const r of document.querySelectorAll('[data-lap-bar]')) {
      const i = Number(r.dataset.lapBar);
      r.onclick = later(() => PV.selectLap(PV.lap.selected === i ? null : i));
      r.onpointerenter = () => PV.hoverLap(i);
      r.onpointerleave = () => PV.hoverLap(null);
    }
  };
  /* lap selection / hover, kept in sync in both frames */
  PV.lap = { selected: null, hovered: null };
  PV.lapsRowOpen = false;
  PV.selectLap = (i) => PV.applyLap(i); // this frame only (one-way state)
  PV.applyLap = (i) => {
    const s = PV.session;
    let next = i;
    if (next !== null && (next < 0 || next >= s.lapSpans.length)) return;
    PV.lap.selected = next;
    const st = PV.state;
    $('#pills').innerHTML = st.scenario === 'loading' ? '' : renderPills(st);
    PV.renderBadges();
    wire(st);
    PV.paintLapStrip();
    PV.maps.lapChanged();
  };
  PV.hoverLap = (i) => {
    if (PV.lap.hovered === i) return;
    PV.lap.hovered = i;
    PV.paintLapStrip();
    PV.maps.paintLaps();
  };
})();
