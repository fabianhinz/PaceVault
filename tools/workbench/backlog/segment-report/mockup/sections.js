(() => {
  const R = window.RPT;
  const V = window.RPT_RENDER;
  const L = V.L;

  const rankline = (slot, st) => {
    const n = st.secs.length;
    const pct = n > 1 ? Math.round((st.slower / (n - 1)) * 100) : null;
    slot.innerHTML =
      `<p class="t-h3 num" style="margin:0">${L(`${R.ordinal(st.rank, 'en')} of ${n}`, `${st.rank}. von ${n}`)}</p>` +
      `<p class="t-cap num" style="margin:0">${L(`faster than ${pct} % of the other passes`, `schneller als ${pct} % der übrigen Durchgänge`)} · ${R.mmss(st.latest.sec)} · ${R.date(st.latest.date, V.lang())}</p>`;
  };

  const strip = (slot, st, passes) => {
    const W = slot.clientWidth;
    const H = 56;
    const lo = st.secs[0];
    const hi = st.secs[st.secs.length - 1];
    const x = (v) => 6 + ((v - lo) / (hi - lo || 1)) * (W - 12);
    const bins = {};
    const dots = passes
      .map((p) => {
        const b = Math.round(x(p.sec) / 9);
        bins[b] = (bins[b] ?? 0) + 1;
        const cy = H - 8 - (bins[b] - 1) * 9;
        if (p === st.latest) return `<circle cx="${x(p.sec)}" cy="${cy}" r="5" fill="#e5e7eb"/>`;
        if (p === st.best) return `<circle cx="${x(p.sec)}" cy="${cy}" r="5" fill="${V.BEST}"/>`;
        return `<circle cx="${x(p.sec)}" cy="${cy}" r="4" fill="${V.SPORT}" fill-opacity="0.45"/>`;
      })
      .join('');
    const med = st.median === null ? '' : `<line x1="${x(st.median)}" x2="${x(st.median)}" y1="4" y2="${H}" stroke="#8b8f9a" stroke-dasharray="3 3"/>`;
    slot.innerHTML =
      `<svg width="${W}" height="${H}">${med}${dots}</svg>` +
      `<div class="axis"><span class="t-cap best num">${R.mmss(lo)}</span><span class="t-cap c3">${L('median dashed · latest white', 'Median gestrichelt · zuletzt weiß')}</span><span class="t-cap c3 num">${R.mmss(hi)}</span></div>`;
  };

  const tilesq = (slot, st) => {
    slot.innerHTML = [
      V.tile({ title: L('Best', 'Bestzeit'), value: `<span class="best">${R.mmss(st.best.sec)}</span>` }),
      V.tile({ title: '25 %', value: R.mmss(st.p25), note: L('a quarter is faster', 'ein Viertel schneller') }),
      V.tile({ title: 'Median', value: R.mmss(st.median) }),
      V.tile({ title: '75 %', value: R.mmss(st.p75), note: L('a quarter is slower', 'ein Viertel langsamer') }),
    ].join('');
  };

  const top5 = (slot, st, passes) => {
    const sorted = [...passes].sort((a, b) => a.sec - b.sec).slice(0, 5);
    slot.innerHTML = sorted
      .map(
        (p, i) =>
          `<button class="li" style="grid-template-columns:24px 64px 1fr 56px"><span class="t-s2 num">${i + 1}</span>` +
          `<span class="t-b1 num ${i === 0 ? 'best' : ''}">${i === 0 ? V.CROWN : ''}${R.mmss(p.sec)}</span>` +
          `<span class="t-cap c2 trunc">${R.date(p.date, V.lang())}</span>` +
          `<span class="t-cap c3 num" style="text-align:right">${i === 0 ? '' : R.gap(p.sec - st.best.sec)}</span></button>`,
      )
      .join('');
  };

  const noData = (slot, en, de) => {
    slot.innerHTML = `<div class="note"><p class="t-cap" style="margin:0">${L(en, de)}</p></div>`;
  };

  const bodyTiles = (slot, st, missing, passes) => {
    const p = st.latest;
    const effs = passes.map((x) => x.power / x.hr).sort((a, b) => a - b);
    const lang = V.lang();
    slot.innerHTML = [
      V.tile({ title: L('Heart rate', 'Herzfrequenz'), value: missing ? '--' : p.hr, unit: missing ? '' : 'bpm' }),
      V.tile({ title: L('Power', 'Leistung'), value: missing ? '--' : p.power, unit: missing ? '' : 'W' }),
      V.tile({
        title: L('Per beat', 'Pro Schlag'),
        value: missing ? '--' : R.num(p.power / p.hr, lang, 2),
        unit: missing ? '' : 'W/bpm',
        note: missing ? '' : `${L('median', 'Median')} ${R.num(effs[Math.floor(effs.length / 2)], lang, 2)}`,
      }),
    ].join('');
  };

  const hrScatter = (slot, passes, st) => {
    const W = slot.clientWidth;
    const H = 130;
    const hrs = passes.map((p) => p.hr);
    const x = V.scaleY(hrs, W - 8, 8, false);
    const xx = (v) => W - x(v);
    const y = V.scaleY(passes.map((p) => p.sec), 8, H - 8, true);
    const dots = passes
      .map((p) => `<circle cx="${xx(p.hr)}" cy="${y(p.sec)}" r="4" fill="${p === st.best ? V.BEST : V.SPORT}" fill-opacity="${p === st.best ? 1 : 0.45}"/>`)
      .join('');
    slot.innerHTML =
      `<div class="row"><div class="grow"><svg width="${W}" height="${H}">${dots}</svg></div></div>` +
      `<div class="axis"><span class="t-cap c3 num">${Math.min(...hrs)} bpm</span><span class="t-cap c3">${L('avg heart rate →, faster ↑', 'Ø Herzfrequenz →, schneller ↑')}</span><span class="t-cap c3 num">${Math.max(...hrs)} bpm</span></div>`;
  };

  window.RPT_SECTIONS = { rankline, strip, tilesq, top5, noData, bodyTiles, hrScatter };
})();
