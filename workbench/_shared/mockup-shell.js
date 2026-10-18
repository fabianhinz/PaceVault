/*
 * Mockup shell: one toolbar, one frame area, one notes panel for every mockup.
 *
 * Frames scale to fit only while the scale stays ≥ 0.86; "both" only when both frames do.
 *
 * A mockup declares, the shell renders:
 *   <script type="application/json" id="mockup-config"> { title, variants, scenarios, extras,
 *     decisions } </script>   (decisions = every Q label, status open | settled; the Questions
 *                               tab lists open ones first)
 *   <template id="mockup-screen"> markup rendered into the desktop and the phone frame </template>
 *   <template id="mockup-notes"> free-form notes (Notes tab) </template>
 *
 * Inside the screen markup:
 *   data-when="scenario:cold"   shown only when the state matches (any key; "a|b" alternatives)
 *   data-de="…"                 German text; the element's own text is English
 *   data-q="Q1"                 renders the decision badge for Q1 (status from config.decisions)
 * Each screen root gets data-device, data-view, data-lang, data-variant, data-scenario, data-<extra>.
 *
 * Mockup scripts:
 *   MockupShell.onChange((state, screens) => …)   on every state change; screens = the two roots
 *   MockupShell.onAction('replay', fn)            a "button" extra was pressed
 *   MockupShell.set('scenario', 'cold')           change one state key from a script
 *   MockupShell.setOptions('step', [{id, label, disabled?}]) replace a choice extra's options (e.g. Step
 *                                                 depends on Path); the value stays if still
 *                                                 present, else becomes the first option
 *   MockupShell.hydrate({ variant, scenario, … }) set many keys at once, one render
 *
 * Extra notes-panel tabs, after Notes · Questions, in document order:
 *   <template id="mockup-panel-inspector" data-label="Inspector"> … </template>
 *
 * Config "frame": "iframe" (default: inline divs): each frame is one srcdoc iframe at the
 * device size, so dvh, media queries and app frameworks (Preact) behave as on a real device.
 *   - The screen template's content is the iframe's <body>, its scripts run inside the iframe;
 *     the host page's <style> and stylesheet <link>s are copied into the iframe's <head>.
 *   - The state attributes above go on the iframe's <html> (class "ms-frame-doc"); onChange
 *     gets those <html> elements as screens, and fires first once both iframes have loaded.
 *   - Scripts inside an iframe reach the shell as parent.MockupShell and find their own root
 *     as document.documentElement.
 */
(() => {
  const cfg = JSON.parse(document.getElementById('mockup-config').textContent);
  const screenTpl = document.getElementById('mockup-screen');
  const notesTpl = document.getElementById('mockup-notes');
  const MIN_SCALE = 0.86; // 14px app text stays ≥ 12px; below this, show 1:1 and scroll instead
  const FRAMES = {
    desktop: [1280, 800, 'Desktop · 1280 × 800'],
    phone: [390, 844, 'Phone · 390 × 844'],
  };
  const VIEWS = [
    { id: 'both', label: 'Both' },
    { id: 'desktop', label: 'Desktop' },
    { id: 'phone', label: 'Phone 390' },
  ];
  const LANGS = [
    { id: 'en', label: 'EN' },
    { id: 'de', label: 'DE' },
  ];
  const ONOFF = [
    { id: 'on', label: 'On' },
    { id: 'off', label: 'Off' },
  ];

  const state = { view: 'both', lang: 'en', labels: 'on' };
  if (cfg.variants?.length) state.variant = cfg.variants[0].id;
  if (cfg.scenarios?.length) state.scenario = cfg.scenarios[0].id;
  for (const x of cfg.extras ?? []) {
    if (x.type === 'toggle') state[x.id] = x.default ?? 'off';
    if (x.type === 'choice') state[x.id] = x.default ?? x.options[0].id;
  }
  const listeners = [];
  const actions = {};

  const h = (tag, attrs, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs ?? {})) {
      if (v === undefined || v === false) continue;
      if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    el.append(...kids.filter((k) => k !== undefined && k !== null));
    return el;
  };

  // ---------- toolbar: View · Language · Variant · Scenario · extras · Labels · Notes ----------
  const controls = {};
  const control = (key, label, options) => {
    // every control is a native select: one compact line, whatever the option count
    const body = h(
      'select',
      {
        class: 'ms-select',
        'data-key': key,
        'aria-label': label,
        onchange: (e) => set(key, e.target.value),
      },
      ...options.map((o) => h('option', { value: o.id, disabled: o.disabled }, o.label)),
    );
    controls[key] = h(
      'div',
      { class: 'ms-group', role: 'group', 'aria-label': label },
      h('span', { class: 'ms-group__label' }, label),
      body,
    );
    return controls[key];
  };
  // the controls scroll sideways; Notes stays pinned at the right edge behind a divider
  const bar = h('header', { class: 'ms-bar' });
  const scroll = h('div', { class: 'ms-bar__scroll' });
  scroll.append(control('view', 'View', VIEWS), control('lang', 'Language', LANGS));
  if (cfg.variants?.length) scroll.append(control('variant', 'Variant', cfg.variants));
  if (cfg.scenarios?.length) scroll.append(control('scenario', 'Scenario', cfg.scenarios));
  for (const x of cfg.extras ?? []) {
    if (x.type === 'button')
      scroll.append(
        h('button', { type: 'button', class: 'ms-btn', onclick: () => actions[x.id]?.() }, x.label),
      );
    else scroll.append(control(x.id, x.label, x.type === 'toggle' ? ONOFF : x.options));
  }
  scroll.append(h('span', { class: 'ms-bar__spacer' }), control('labels', 'Labels', ONOFF));
  const notesBtn = h(
    'button',
    { type: 'button', class: 'ms-btn', 'aria-expanded': 'false', onclick: () => togglePanel() },
    'Notes',
  );
  bar.append(scroll, h('div', { class: 'ms-bar__pinned' }, notesBtn));

  // ---------- frames ----------
  const stage = h('main', { class: 'ms-stage' });
  const frames = {};
  const isIframe = cfg.frame === 'iframe';
  let ready = !isIframe; // iframe mode: true once every iframe has loaded
  // iframe mode: the host's styles + the screen template as the body of each frame's document
  const headHtml = [...document.querySelectorAll('head style, head link[rel="stylesheet"]')]
    .map((e) => e.outerHTML)
    .join('');
  const srcdoc = (dev) =>
    `<!doctype html><html class="ms-frame-doc" data-device="${dev}"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width, initial-scale=1">${headHtml}</head><body>${screenTpl.innerHTML}</body></html>`;
  let pending = 0;
  for (const [dev, [w, ht, cap]] of Object.entries(FRAMES)) {
    const screen = h(isIframe ? 'iframe' : 'div', { class: 'ms-screen', 'data-device': dev });
    screen.style.width = `${w}px`;
    screen.style.height = `${ht}px`;
    if (isIframe) {
      pending++;
      screen.title = `${dev} frame`;
      screen.srcdoc = srcdoc(dev);
      screen.addEventListener('load', () => (--pending === 0 ? onReady() : undefined), {
        once: true,
      });
    } else screen.append(screenTpl.content.cloneNode(true));
    const box = h('div', { class: `ms-frame__box ms-frame__box--${dev}` }, screen);
    const el = h(
      'figure',
      { class: `ms-frame ms-frame--${dev}` },
      h('figcaption', { class: 'ms-frame__cap' }, cap),
      box,
    );
    frames[dev] = { el, screen, box, w, ht };
    stage.append(el);
  }
  const screens = () =>
    Object.values(frames).map((f) =>
      isIframe ? f.screen.contentDocument.documentElement : f.screen,
    );

  // ---------- notes panel: Notes · Questions ----------
  const statusLabel = { open: 'open', settled: 'settled' };
  const badge = (q) => {
    const d = (cfg.decisions ?? []).find((x) => x.id === q);
    return h(
      'button',
      {
        type: 'button',
        class: `ms-q ms-q--${d?.status ?? 'open'}`,
        title: d?.title ?? q,
        onclick: () => togglePanel('questions', q),
      },
      q,
    );
  };
  // one Questions tab: open items first, then settled ones (same order as in the config otherwise)
  const allDecisions = cfg.decisions ?? [];
  const openCount = allDecisions.filter((d) => d.status === 'open').length;
  const decisions = h(
    'ol',
    { class: 'ms-decisions' },
    ...[
      ...allDecisions.filter((d) => d.status === 'open'),
      ...allDecisions.filter((d) => d.status !== 'open'),
    ].map((d) =>
      h(
        'li',
        { id: `ms-dec-${d.id}` },
        h(
          'div',
          { class: 'ms-decisions__head' },
          badge(d.id),
          h('strong', {}, d.title),
          h('span', { class: 'ms-decisions__status' }, statusLabel[d.status]),
        ),
        d.options ? h('p', {}, d.options) : undefined,
        d.answer ? h('p', { class: 'ms-decisions__answer' }, d.answer) : undefined,
      ),
    ),
  );
  const notes = h('div', { class: 'ms-notes' });
  if (notesTpl) notes.append(notesTpl.content.cloneNode(true));
  const tabs = {
    notes: ['Notes', notes],
    questions: [openCount > 0 ? `Questions · ${openCount} open` : 'Questions', decisions],
  };
  for (const tpl of document.querySelectorAll('template[id^="mockup-panel-"]')) {
    const pane = h('div', { class: 'ms-notes' }, tpl.content.cloneNode(true));
    tabs[tpl.id.slice('mockup-panel-'.length)] = [tpl.dataset.label ?? tpl.id, pane];
  }
  const tabBar = h('div', { class: 'ms-tabs', role: 'tablist' });
  const panelBody = h('div', { class: 'ms-panel__body' });
  for (const [id, [label, content]] of Object.entries(tabs)) {
    tabBar.append(
      h(
        'button',
        { type: 'button', role: 'tab', 'data-tab': id, onclick: () => showTab(id) },
        label,
      ),
    );
    content.dataset.pane = id;
    panelBody.append(content);
  }
  const panel = h(
    'aside',
    { class: 'ms-panel', 'aria-label': 'Notes and decisions' },
    tabBar,
    panelBody,
  );
  const showTab = (id) => {
    for (const b of tabBar.children) b.setAttribute('aria-selected', String(b.dataset.tab === id));
    for (const c of panelBody.children) c.hidden = c.dataset.pane !== id;
  };
  const togglePanel = (tab, q) => {
    const open = tab ? true : !document.body.classList.contains('ms-panel-open');
    document.body.classList.toggle('ms-panel-open', open);
    notesBtn.setAttribute('aria-expanded', String(open));
    if (tab) showTab(tab);
    for (const li of decisions.children) li.classList.toggle('is-focus', li.id === `ms-dec-${q}`);
    layout();
  };
  showTab('notes');

  document.body.classList.add('ms');
  document.body.prepend(bar, h('div', { class: 'ms-main' }, stage, panel));

  // Q badges inside the screens (rendered once)
  const renderBadges = () => {
    for (const s of screens())
      for (const el of s.querySelectorAll('[data-q]')) el.replaceWith(badge(el.dataset.q));
  };
  if (ready) renderBadges();

  // ---------- state → DOM ----------
  const fit = (devs) => {
    const r = stage.getBoundingClientRect();
    const pad = 32;
    const capH = 28;
    const gap = 24;
    const w = devs.reduce((a, d) => a + frames[d].w, 0);
    const ht = Math.max(...devs.map((d) => frames[d].ht));
    return Math.min(1, (r.width - pad - gap * (devs.length - 1)) / w, (r.height - pad - capH) / ht);
  };
  const layout = () => {
    const bothOk = fit(['desktop', 'phone']) >= MIN_SCALE;
    const viewSelect = bar.querySelector('select[data-key="view"]');
    const bothOption = viewSelect.querySelector('option[value="both"]');
    // greyed out in the list when the window can't fit both frames at a readable size
    bothOption.disabled = !bothOk;
    let view = state.view;
    // "both" only when both frames stay ≥ 85 %; otherwise one frame at a time (phone on narrow screens)
    if (view === 'both' && !bothOk) view = innerWidth < 720 ? 'phone' : 'desktop';
    const devs = view === 'both' ? ['desktop', 'phone'] : [view];
    let s = fit(devs);
    const scroll = s < MIN_SCALE;
    if (scroll) s = 1;
    stage.classList.toggle('is-scroll', scroll);
    stage.dataset.scale = s.toFixed(2);
    for (const [dev, f] of Object.entries(frames)) {
      f.el.hidden = !devs.includes(dev);
      f.screen.style.transform = `scale(${s})`;
      f.screen.style.setProperty('--ms-scale', s);
      if (isIframe && ready)
        f.screen.contentDocument.documentElement.style.setProperty('--ms-scale', s);
      f.box.style.width = `${f.w * s}px`;
      f.box.style.height = `${f.ht * s}px`;
    }
    viewSelect.value = view;
  };
  const apply = () => {
    for (const el of bar.querySelectorAll('select[data-key]')) el.value = state[el.dataset.key];
    document.body.classList.toggle('ms-labels-off', state.labels === 'off');
    document.documentElement.lang = state.lang;
    if (!ready) return layout();
    for (const s of screens()) {
      if (isIframe) s.lang = state.lang;
      for (const [k, v] of Object.entries(state)) s.dataset[k] = v;
      for (const el of s.querySelectorAll('[data-de]')) {
        if (el.dataset.en === undefined) el.dataset.en = el.textContent;
        el.textContent = state.lang === 'de' ? el.dataset.de : el.dataset.en;
      }
      for (const el of s.querySelectorAll('[data-when]')) {
        const [k, v] = el.dataset.when.split(':');
        el.hidden = !v.split('|').includes(state[k]);
      }
    }
    layout();
    for (const fn of listeners) fn(state, screens());
  };
  const set = (key, val) => {
    state[key] = val;
    apply();
  };
  const setOptions = (id, options) => {
    const x = (cfg.extras ?? []).find((e) => e.id === id && e.type === 'choice');
    if (!x) throw new Error(`MockupShell.setOptions: no choice extra "${id}"`);
    x.options = options;
    controls[id].replaceWith(control(id, x.label, options));
    const enabled = options.filter((o) => !o.disabled);
    if (!enabled.some((o) => o.id === state[id])) state[id] = enabled[0].id;
    apply();
  };
  const hydrate = (values) => {
    for (const [k, v] of Object.entries(values)) state[k] = v;
    apply();
  };
  const onReady = () => {
    ready = true;
    renderBadges();
    apply();
  };

  // ---------- board keys: same logic as _shared/frame-keys.js ----------
  // Inside the workbench board's iframe, Esc / [ / ] go to the board (close, previous, next card);
  // in iframe mode also from the inner frame documents.
  const forwardKeys = (win) => {
    if (window.parent === window) return;
    win.addEventListener('keydown', (e) => {
      if (!['Escape', '[', ']'].includes(e.key) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.defaultPrevented) return;
      const typing = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])';
      if (e.target.closest?.(typing)) return;
      if (e.key === 'Escape' && win.document.querySelector('dialog[open]')) return;
      window.parent.postMessage({ wbKey: e.key }, '*');
    });
  };
  forwardKeys(window);
  if (isIframe) {
    for (const f of Object.values(frames))
      f.screen.addEventListener('load', () => forwardKeys(f.screen.contentWindow), { once: true });
  }

  addEventListener('resize', layout);
  window.MockupShell = {
    state,
    screens,
    onChange: (fn) => {
      listeners.push(fn);
      if (ready) fn(state, screens());
    },
    onAction: (id, fn) => {
      actions[id] = fn;
    },
    set,
    setOptions,
    hydrate,
  };
  apply();
})();
