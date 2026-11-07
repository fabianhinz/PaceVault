(() => {
  const R = window.RPT;
  const V = window.RPT_RENDER;
  const S = window.RPT_SECTIONS;
  const L = V.L;
  const KM = ['1', '2', '3', '4', '5'];

  const cellBg = (g) => {
    if (Math.abs(g) < 0.5) return 'rgb(255 255 255 / 0.06)';
    const a = Math.min(0.6, Math.abs(g) / 10 + 0.08).toFixed(2);
    return g > 0 ? `rgb(248 113 113 / ${a})` : `rgb(74 222 128 / ${a})`;
  };
  const short = (g) => {
    const s = Math.round(g);
    if (s === 0) return '0';
    return `${s > 0 ? '+' : '−'}${Math.abs(s)}`;
  };

  const splits = (slot, st, passes) => {
    const best = st.best;
    const others = passes.filter((p) => p !== best).slice(-12).reverse();
    const profile = `<svg viewBox="0 0 100 20" preserveAspectRatio="none" style="width:100%;height:28px"><path d="M0 19 L20 16 L40 12 L60 6 L80 3 L100 1 L100 20 L0 20 Z" fill="rgb(255 255 255 / 0.08)"/></svg>`;
    const head =
      `<div class="grid5"><span></span><div style="grid-column:span 5">${profile}</div><span></span></div>` +
      `<div class="grid5">` +
      `<span class="t-cap c3">${L('Part', 'Teil')}</span>${KM.map((k) => `<span class="t-cap c3 num" style="text-align:center">${k}</span>`).join('')}` +
      `<span class="t-cap c3" style="text-align:right">${L('total', 'gesamt')}</span></div>`;
    const bestRow =
      `<div class="grid5"><span class="t-cap best trunc">${V.CROWN}${L('Best', 'Beste')}</span>` +
      best.parts.map((p) => `<span class="cell t-cap num best" style="background:rgb(251 191 36 / 0.12)">${R.mmss(p)}</span>`).join('') +
      `<span class="t-cap best num" style="text-align:right">${R.mmss(best.sec)}</span></div>`;
    const rowsHtml = others
      .map(
        (p) =>
          `<div class="grid5"><span class="t-cap c2 trunc">${R.date(p.date, V.lang()).replace(/ \d{4}$/, '')}</span>` +
          p.parts.map((x, i) => `<span class="cell t-cap num" style="background:${cellBg(x - best.parts[i])}">${short(x - best.parts[i])}</span>`).join('') +
          `<span class="t-cap c3 num" style="text-align:right">${R.gap(p.sec - best.sec)}</span></div>`,
      )
      .join('');
    const more = passes.length > 13 ? `<span class="t-cap c3">${L(`Latest 12 of ${passes.length - 1} · seconds to the best pass's part`, `Letzte 12 von ${passes.length - 1} · Sekunden zum Teil der Bestzeit`)}</span>` : '';
    slot.innerHTML = `<div class="list" style="gap:2px">${head}${bestRow}${rowsHtml}</div>${more}`;
  };

  const lostPart = (st, passes) => {
    const med = [0, 1, 2, 3, 4].map((i) => {
      const g = passes.map((p) => p.parts[i] - st.best.parts[i]).sort((a, b) => a - b);
      return g[Math.floor(g.length / 2)];
    });
    const worst = med.indexOf(Math.max(...med));
    return { med, worst };
  };

  const theo = (slot, st, passes) => {
    const lost = lostPart(st, passes);
    slot.innerHTML = [
      V.tile({ title: L('Best parts', 'Beste Teile'), value: R.mmss(st.theoretical), note: L('sum of the fastest parts', 'Summe der schnellsten Teile') }),
      V.tile({ title: L('Best pass', 'Bestzeit'), value: `<span class="best">${R.mmss(st.best.sec)}</span>`, note: R.gap(st.best.sec - st.theoretical) + L(' to the sum', ' zur Summe') }),
      V.tile({ title: L('Most time lost', 'Meiste Zeit verloren'), value: `${L('Part', 'Teil')} ${lost.worst + 1}`, note: `${short(lost.med[lost.worst])} s ${L('median', 'Median')}` }),
    ].join('');
  };

  const splitsum = (slot, st, passes) => {
    const lost = lostPart(st, passes);
    slot.innerHTML =
      `<div class="grid5" style="grid-template-columns:repeat(5,minmax(0,1fr))">${lost.med.map((g, i) => `<span class="cell t-cap num" style="background:${cellBg(g)}">${L('Part', 'Teil')} ${i + 1} · ${short(g)}</span>`).join('')}</div>` +
      `<p class="t-cap" style="margin:0">${L(`Median gap to the best pass per part. Sum of best parts ${R.mmss(st.theoretical)}, best pass ${R.mmss(st.best.sec)}.`, `Median-Abstand zur Bestzeit je Teil. Summe bester Teile ${R.mmss(st.theoretical)}, Bestzeit ${R.mmss(st.best.sec)}.`)}</p>`;
  };

  const mini = (title, unit, passes, st, value, missing) => {
    if (missing) return `<div class="tile" style="grid-template-rows:16px auto"><span class="t-ovl">${title}</span><span class="t-cap c3">-- · ${L('no weather for these sessions', 'kein Wetter zu diesen Einheiten')}</span></div>`;
    const W = 140;
    const H = 64;
    const vals = passes.map(value);
    const x = V.scaleY(vals, W - 6, 6, false);
    const y = V.scaleY(passes.map((p) => p.sec), 6, H - 6, true);
    const dots = passes.map((p, i) => `<circle cx="${W - x(vals[i])}" cy="${y(p.sec)}" r="3" fill="${p === st.best ? V.BEST : V.SPORT}" fill-opacity="${p === st.best ? 1 : 0.45}"/>`).join('');
    return (
      `<div class="tile" style="grid-template-rows:16px auto 16px"><span class="t-ovl trunc">${title}</span>` +
      `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:${H}px">${dots}</svg>` +
      `<div class="axis"><span class="t-cap c3 num">${Math.min(...vals)} ${unit}</span><span class="t-cap c3 num">${Math.max(...vals)} ${unit}</span></div></div>`
    );
  };

  const cond = (slot, st, passes, missing) => {
    slot.innerHTML =
      mini(L('Temperature', 'Temperatur'), '°C', passes, st, (p) => p.temp, missing) +
      mini(L('Headwind', 'Gegenwind'), 'km/h', passes, st, (p) => p.head, missing) +
      mini(L('Start hour', 'Startzeit'), L('h', 'Uhr'), passes, st, (p) => p.hour, false);
  };

  const fill = (root, state) => {
    const scenario = state.scenario;
    const passes = R.SETS[scenario];
    const st = R.stats(passes);
    const loading = scenario === 'loading';
    const missing = scenario === 'missing';
    const one = (sel, fn) => {
      for (const el of root.querySelectorAll(`[data-slot="${sel}"]`)) {
        if (el.closest('[hidden]')) continue;
        fn(el);
      }
    };
    one('count', (el) => (el.textContent = loading ? L('Reading passes…', 'Durchgänge werden gelesen…') : `${passes.length} ${passes.length === 1 ? L('pass', 'Durchgang') : L('passes', 'Durchgänge')} · ${[...new Set([passes[0], passes[passes.length - 1]].map((p) => new Date(p.date).getUTCFullYear()))].join('–')}`));
    one('onenote', (el) => (el.textContent = L(`This segment has 1 pass: ${R.mmss(passes[0].sec)} on ${R.date(passes[0].date, 'en')}.`, `Dieses Segment hat 1 Durchgang: ${R.mmss(passes[0].sec)} am ${R.date(passes[0].date, 'de')}.`)));
    one('fewnote', (el) => (el.innerHTML = scenario === 'few' ? `<span class="t-cap c3">${L('Spread needs at least 4 passes.', 'Streuung braucht mindestens 4 Durchgänge.')}</span>` : ''));
    one('tiles4', (el) => V.tiles4(el, st, loading));
    const chartOr = (el, h, fn) => (loading ? (el.innerHTML = V.sk(h)) : fn());
    one('trend', (el) => chartOr(el, 140, () => V.trendChart(el, { passes }, { compact: el.dataset.compact === '1', value: (p) => p.sec, lowerIsBetter: true, fmt: R.mmss })));
    one('years', (el) => chartOr(el, 96, () => V.years(el, st, el.dataset.compact === '1')));
    one('rankline', (el) => chartOr(el, 48, () => S.rankline(el, st)));
    one('strip', (el) => chartOr(el, 72, () => S.strip(el, st, passes)));
    one('tilesq', (el) => (loading ? (el.innerHTML = ['', '', '', ''].map(() => V.tileSk('·')).join('')) : S.tilesq(el, st)));
    one('top5', (el) => chartOr(el, 160, () => S.top5(el, st, passes)));
    one('bodytiles', (el) => (loading ? (el.innerHTML = ['', '', ''].map(() => V.tileSk('·')).join('')) : S.bodyTiles(el, st, missing, passes)));
    one('eff', (el) =>
      chartOr(el, 140, () =>
        missing
          ? S.noData(el, 'No pass has both heart rate and power.', 'Kein Durchgang hat Herzfrequenz und Leistung.')
          : V.trendChart(el, { passes }, { value: (p) => Math.round((p.power / p.hr) * 100) / 100, lowerIsBetter: false, fmt: (v) => R.num(v, V.lang(), 2) }),
      ),
    );
    one('hrscatter', (el) => chartOr(el, 140, () => (missing ? S.noData(el, 'No pass has heart rate.', 'Kein Durchgang hat Herzfrequenz.') : S.hrScatter(el, passes, st))));
    one('splits', (el) => chartOr(el, 300, () => splits(el, st, passes)));
    one('theo', (el) => (loading ? (el.innerHTML = ['', '', ''].map(() => V.tileSk('·')).join('')) : theo(el, st, passes)));
    one('splitsum', (el) => chartOr(el, 48, () => splitsum(el, st, passes)));
    one('cond', (el) => chartOr(el, 96, () => cond(el, st, passes, missing)));
  };

  MockupShell.onChange((state, screens) => {
    V.setLang(state.lang);
    for (const s of screens) fill(s, state);
  });
})();
