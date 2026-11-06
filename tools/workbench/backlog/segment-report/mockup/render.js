(() => {
  const R = window.RPT;
  const SPORT = '#f97316';
  const BEST = '#fbbf24';
  const CROWN =
    '<svg width="12" height="12" viewBox="0 0 24 24" fill="#fbbf24" aria-hidden="true" style="vertical-align:-1px;margin-right:4px"><path d="M2 7l5 4 5-7 5 7 5-4-2 12H4z"/></svg>';
  let lang = 'en';
  const L = (en, de) => (lang === 'de' ? de : en);
  const sk = (h, w = '100%') => `<span class="sk" style="height:${h}px;width:${w}"></span>`;

  const tile = (t) =>
    `<div class="tile"><span class="t-ovl trunc">${t.title}</span>` +
    `<p class="t-h3 num trunc" style="margin:0">${t.value}${t.unit ? `<span class="t-cap" style="margin-left:2px">${t.unit}</span>` : ''}</p>` +
    `<span class="t-cap c3 num trunc">${t.note ?? ''}</span></div>`;
  const tileSk = (title) =>
    `<div class="tile"><span class="t-ovl trunc">${title}</span>${sk(24, '60%')}<span></span></div>`;

  const scaleY = (vals, top, bottom, invert) => {
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const span = hi - lo || 1;
    return (v) => (invert ? top + ((v - lo) / span) * (bottom - top) : bottom - ((v - lo) / span) * (bottom - top));
  };

  const series = ({ passes, value, height, faster, best }) => {
    const n = passes.length;
    const values = passes.map(value);
    return { n, values, height, faster, best };
  };

  const trendChart = (slot, s, opts) => {
    const W = slot.clientWidth;
    const H = opts.compact ? 96 : 140;
    const labelW = 44;
    const inner = Math.max(W - labelW, s.passes.length * 9);
    const x0 = R.START;
    const span = R.END - R.START;
    const xs = s.passes.map((p) => (s.passes.length === 1 ? inner / 2 : 8 + ((p.date - x0) / span) * (inner - 16)));
    const vals = s.passes.map(opts.value);
    const y = scaleY(vals, 10, H - 10, opts.lowerIsBetter);
    const med = R.rollingMedian(vals);
    const line = med.map((v, i) => `${i ? 'L' : 'M'}${xs[i].toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
    const bestIdx = vals.indexOf(opts.lowerIsBetter ? Math.min(...vals) : Math.max(...vals));
    const dots = vals
      .map((v, i) =>
        i === bestIdx
          ? ''
          : `<circle cx="${xs[i].toFixed(1)}" cy="${y(v).toFixed(1)}" r="4" fill="${SPORT}" fill-opacity="0.45"/>`,
      )
      .join('');
    const bestDot = `<circle cx="${xs[bestIdx].toFixed(1)}" cy="${y(vals[bestIdx]).toFixed(1)}" r="5" fill="${BEST}"/>`;
    const years = [2023, 2024, 2025, 2026]
      .map((yr) => {
        const left = 8 + ((Date.UTC(yr, 0, 1) - x0) / span) * (inner - 16);
        return `<span class="t-cap c3" style="position:absolute;left:${Math.max(0, left).toFixed(0)}px;top:${H + 2}px">${yr}</span>`;
      })
      .join('');
    const medNow = med[med.length - 1];
    const label = (v, text, cls) =>
      `<span class="t-cap num ${cls}" style="position:absolute;right:0;top:${(y(v) - 8).toFixed(0)}px">${text}</span>`;
    slot.innerHTML =
      `<div class="chart" style="height:${H + 20}px">` +
      `<div class="scroller" style="width:${W - labelW}px;height:${H + 20}px"><div style="position:relative;width:${inner}px">` +
      `<svg width="${inner}" height="${H}">${dots}${s.passes.length > 1 ? `<path d="${line}" stroke="#e5e7eb" stroke-width="2" fill="none"/>` : ''}${bestDot}</svg>${years}</div></div>` +
      label(vals[bestIdx], opts.fmt(vals[bestIdx]), 'best') +
      (s.passes.length > 1 && Math.abs(y(medNow) - y(vals[bestIdx])) > 16 ? label(medNow, opts.fmt(medNow), 'c2') : '') +
      `</div>`;
    const sc = slot.querySelector('.scroller');
    sc.scrollLeft = sc.scrollWidth;
  };

  const rows = {
    year: (y, st, lo, hi) => {
      const pos = (v) => (((v - lo) / (hi - lo || 1)) * 100).toFixed(1);
      const overall = y.best === st.best.sec;
      return (
        `<button class="li"><span class="t-s2">${y.year}</span>` +
        `<span class="t-b1 num ${overall ? 'best' : ''}">${overall ? CROWN : ''}${R.mmss(y.best)}</span>` +
        `<span class="bar"><b style="left:${pos(y.best)}%;right:${(100 - pos(y.median)).toFixed(1)}%"></b></span>` +
        `<span class="t-cap c3 num" style="text-align:right">${y.count} ${y.count === 1 ? L('pass', 'Durchgang') : L('passes', 'Durchgänge')}</span></button>`
      );
    },
  };

  const years = (slot, st, compact) => {
    const list = compact ? st.byYear.slice(0, 3) : st.byYear;
    slot.innerHTML =
      list.map((y) => rows.year(y, st, st.secs[0], st.secs[st.secs.length - 1])).join('') +
      `<span class="t-cap c3" style="padding:0 8px">${L('Bar: best to median of the year', 'Balken: Bestzeit bis Median des Jahres')}</span>`;
  };

  const tiles4 = (slot, st, loading) => {
    const titles = [L('Best', 'Bestzeit'), L('Median', 'Median'), L('Latest', 'Zuletzt'), L('Spread', 'Streuung')];
    if (loading) return (slot.innerHTML = titles.map(tileSk).join(''));
    const spread = st.p75 === null ? null : st.p75 - st.p25;
    slot.innerHTML = [
      tile({ title: titles[0], value: `<span class="best">${R.mmss(st.best.sec)}</span>`, note: R.date(st.best.date, lang) }),
      tile({ title: titles[1], value: R.mmss(st.median), note: `${st.secs.length} ${L('passes', 'Durchgänge')}` }),
      tile({ title: titles[2], value: R.mmss(st.latest.sec), note: `${R.gap(st.latest.sec - st.best.sec)} ${L('to best', 'zur Bestzeit')}` }),
      tile({ title: titles[3], value: R.mmss(spread), note: L('middle 50 %', 'mittlere 50 %') }),
    ].join('');
  };

  window.RPT_RENDER = { L, sk, tile, tileSk, scaleY, trendChart, years, tiles4, setLang: (l) => (lang = l), lang: () => lang, SPORT, BEST, CROWN, series };
})();
