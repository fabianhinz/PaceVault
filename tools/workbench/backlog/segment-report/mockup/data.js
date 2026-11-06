(() => {
  const rng = (seed) => () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const DAY = 86400000;
  const START = Date.UTC(2023, 2, 4);
  const END = Date.UTC(2026, 10, 3);

  const makePass = (r, date) => {
    const progress = (date - START) / (END - START);
    const season = Math.cos(((new Date(date).getUTCMonth() + 0.5) / 12) * 2 * Math.PI);
    const base = 318 - 40 * progress + 9 * season;
    const sec = Math.round(base + (r() - 0.35) * 34);
    const hr = Math.round(158 + (r() - 0.5) * 14 - 6 * progress + (300 - sec) * 0.12);
    const power = Math.round(255 + 30 * progress + (300 - sec) * 0.9 + (r() - 0.5) * 12);
    const temp = Math.round(12 - 10 * season + (r() - 0.5) * 6);
    const head = Math.round((r() - 0.5) * 24);
    const hour = 6 + Math.floor(r() * 13);
    const parts = [0.19, 0.2, 0.23, 0.21, 0.17].map((share) => share * sec * (0.93 + r() * 0.14));
    const scale = sec / parts.reduce((a, b) => a + b, 0);
    return { date, sec, hr, power, temp, head, hour, parts: parts.map((p) => p * scale) };
  };

  const build = (count) => {
    const r = rng(7 + count);
    const out = [];
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? END : START + ((END - START) * i) / (count - 1);
      const jitter = count > 3 ? Math.round((r() - 0.5) * 10) * DAY : 0;
      out.push(makePass(r, Math.min(END, t + jitter)));
    }
    return out.sort((a, b) => a.date - b.date);
  };

  const SETS = { many: build(60), few: build(3), one: build(1), loading: build(60), missing: build(60) };

  const quantile = (sorted, q) => {
    if (sorted.length < 4) return null;
    const pos = (sorted.length - 1) * q;
    const lo = Math.floor(pos);
    const hi = Math.ceil(pos);
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
  };

  const stats = (passes) => {
    const secs = passes.map((p) => p.sec).sort((a, b) => a - b);
    const best = passes.reduce((a, b) => (b.sec < a.sec ? b : a));
    const latest = passes[passes.length - 1];
    const rank = 1 + passes.filter((p) => p.sec < latest.sec).length;
    const slower = passes.filter((p) => p.sec > latest.sec).length;
    const mid = (secs.length - 1) / 2;
    const median = secs.length >= 2 ? (secs[Math.floor(mid)] + secs[Math.ceil(mid)]) / 2 : null;
    const p25 = quantile(secs, 0.25);
    const p75 = quantile(secs, 0.75);
    const years = {};
    for (const p of passes) {
      const y = new Date(p.date).getUTCFullYear();
      (years[y] ??= []).push(p);
    }
    const byYear = Object.entries(years)
      .map(([year, list]) => {
        const s = list.map((p) => p.sec).sort((a, b) => a - b);
        return { year, count: list.length, best: s[0], median: s[Math.floor(s.length / 2)] };
      })
      .sort((a, b) => b.year - a.year);
    const bestParts = [0, 1, 2, 3, 4].map((i) => Math.min(...passes.map((p) => p.parts[i])));
    const theoretical = bestParts.reduce((a, b) => a + b, 0);
    return { secs, best, latest, rank, slower, median, p25, p75, byYear, bestParts, theoretical };
  };

  const rollingMedian = (values, n = 5) =>
    values.map((_, i) => {
      const w = values.slice(Math.max(0, i - n + 1), i + 1).sort((a, b) => a - b);
      return w[Math.floor(w.length / 2)];
    });

  const mmss = (sec) => {
    if (sec === null || sec === undefined) return '--';
    const s = Math.round(sec);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };
  const gap = (sec) => {
    const s = Math.round(sec);
    if (s === 0) return '±0:00';
    return `${s > 0 ? '+' : '−'}${mmss(Math.abs(s))}`;
  };
  const date = (ms, lang) =>
    new Intl.DateTimeFormat(lang === 'de' ? 'de-DE' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(ms);
  const num = (value, lang, digits = 0) =>
    new Intl.NumberFormat(lang === 'de' ? 'de-DE' : 'en-GB', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value);
  const ordinal = (n, lang) => {
    if (lang === 'de') return `${n}.`;
    const tail = { 1: 'st', 2: 'nd', 3: 'rd' }[n % 100 > 10 && n % 100 < 14 ? 0 : n % 10] ?? 'th';
    return `${n}${tail}`;
  };

  window.RPT = { SETS, stats, rollingMedian, mmss, gap, date, num, ordinal, START, END };
})();
