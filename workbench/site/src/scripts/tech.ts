import type { Mermaid } from 'mermaid';

/**
 * The Tech tab (tech-tab round 3): Mermaid + ELK load on the first Tech open (Q4) and draw every
 * ```mermaid block of tech.md; each figure gets Fit · Zoom and an expand dialog; Modules gets
 * the Planned · Actual toggle with `review/deps.mmd`.
 */

let loading: Promise<Mermaid> | undefined = undefined;

const loadMermaid = () => {
  if (loading) return loading;
  loading = (async () => {
    const mermaid = (await import('mermaid')).default;
    const elk = (await import('@mermaid-js/layout-elk')).default;
    mermaid.registerLayoutLoaders(elk);
    mermaid.initialize({
      startOnLoad: false,
      layout: 'elk',
      theme: 'base',
      maxEdges: 3000,
      maxTextSize: 300000,
      themeVariables: {
        darkMode: true,
        background: '#0a0b0f',
        primaryColor: '#1a1d24',
        primaryTextColor: '#e5e7eb',
        primaryBorderColor: '#3a3e48',
        nodeTextColor: '#e5e7eb',
        textColor: '#b0b4be',
        lineColor: '#5c616e',
        secondaryColor: '#111318',
        tertiaryColor: '#111318',
        clusterBkg: '#111318',
        clusterBorder: '#252830',
        edgeLabelBackground: '#0a0b0f',
        titleColor: '#8b8f9a',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        fontSize: '16px',
      },
      flowchart: { curve: 'basis', padding: 8, useMaxWidth: false },
    });
    return mermaid;
  })();
  return loading;
};

/* ---------- zoom and pan: wheel/pinch around the pointer, drag to pan, reset to fit ----------
   The svg keeps its natural size and moves by a CSS transform inside a fixed box, so zooming
   never shifts the page. Inline, plain wheel scrolls the page: zoom is Ctrl/⌘ + wheel or a
   trackpad pinch (a wheel event with ctrlKey); in the expand dialog the plain wheel zooms. */
type View = { scale: number; x: number; y: number; fit: number };
const views = new WeakMap<HTMLElement, View>();

const apply = (box: HTMLElement, view: View) => {
  views.set(box, view);
  const svg = box.querySelector<SVGSVGElement>('svg');
  if (svg) svg.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.scale})`;
};

/** Whole graph in the box, centred; an inline box takes the fitted height once. */
const resetView = (box: HTMLElement) => {
  const svg = box.querySelector<SVGSVGElement>('svg');
  const width = Number(svg?.dataset.w);
  const height = Number(svg?.dataset.h);
  if (!svg || box.clientWidth <= 0 || !(width > 0) || !(height > 0)) return;
  svg.style.width = `${width}px`;
  svg.style.height = `${height}px`;
  let fit = Math.min(1, box.clientWidth / width);
  if (box.classList.contains('tt-full__body')) fit = Math.min(fit, box.clientHeight / height);
  else if (!box.style.height) box.style.height = `${Math.ceil(height * fit)}px`;
  const x = (box.clientWidth - width * fit) / 2;
  const y = Math.max(0, (box.clientHeight - height * fit) / 2);
  apply(box, { scale: fit, x, y, fit });
};

/** Fits every not yet fitted diagram under `root` (it was hidden until now). */
export const refitTech = (root: Element) => {
  for (const box of root.querySelectorAll<HTMLElement>('[data-graph]')) {
    if (!views.has(box)) resetView(box);
  }
};

const zoomAt = (box: HTMLElement, factor: number, clientX: number, clientY: number) => {
  const view = views.get(box);
  if (!view) return;
  const scale = Math.min(Math.max(view.scale * factor, view.fit / 2), 8);
  const rect = box.getBoundingClientRect();
  const px = clientX - rect.left;
  const py = clientY - rect.top;
  const ratio = scale / view.scale;
  apply(box, { ...view, scale, x: px - (px - view.x) * ratio, y: py - (py - view.y) * ratio });
};

const makePannable = (box: HTMLElement) => {
  box.title = 'Drag to pan · Ctrl/⌘ + wheel or pinch to zoom · double-click to reset';
  if (box.classList.contains('tt-full__body'))
    box.title = 'Drag to pan · wheel or pinch to zoom · double-click to reset';
  box.addEventListener(
    'wheel',
    (event) => {
      const inDialog = box.classList.contains('tt-full__body');
      if (!inDialog && !event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      zoomAt(box, Math.exp(-event.deltaY * 0.002), event.clientX, event.clientY);
    },
    { passive: false },
  );
  let last: { x: number; y: number } | undefined = undefined;
  box.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || !views.has(box)) return;
    last = { x: event.clientX, y: event.clientY };
    box.setPointerCapture(event.pointerId);
    box.classList.add('is-panning');
  });
  box.addEventListener('pointermove', (event) => {
    const view = views.get(box);
    if (!last || !view) return;
    apply(box, { ...view, x: view.x + event.clientX - last.x, y: view.y + event.clientY - last.y });
    last = { x: event.clientX, y: event.clientY };
  });
  const end = () => {
    last = undefined;
    box.classList.remove('is-panning');
  };
  box.addEventListener('pointerup', end);
  box.addEventListener('pointercancel', end);
  box.addEventListener('dblclick', () => resetView(box));
};

const toolButton = (label: string, text: string, onClick: () => void) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'tt-expand';
  button.title = label;
  button.setAttribute('aria-label', label);
  button.textContent = text;
  button.addEventListener('click', onClick);
  return button;
};

/* ---------- the expand dialog: the diagram's svg moves in while open and back on close ---------- */
let fullFrom: HTMLElement | undefined = undefined;

const fullDialog = () => document.querySelector<HTMLDialogElement>('.tt-full');

const initFull = () => {
  const full = fullDialog();
  const body = full?.querySelector<HTMLElement>('.tt-full__body');
  if (!full || !body || full.dataset.ready) return;
  full.dataset.ready = 'true';
  makePannable(body);
  full
    .querySelector('.tt-full__tools')
    ?.prepend(toolButton('Reset view (or double-click)', '↺', () => resetView(body)));
  full.querySelector('.tt-full__close')?.addEventListener('click', () => full.close());
  full.addEventListener('close', () => {
    const svg = body.querySelector('svg');
    if (svg && fullFrom) {
      fullFrom.append(svg);
      resetView(fullFrom);
    }
    fullFrom = undefined;
  });
};

const openFull = (graph: HTMLElement) => {
  const full = fullDialog();
  const body = full?.querySelector<HTMLElement>('.tt-full__body');
  const svg = graph.querySelector('svg');
  if (!full || !body || !svg) return;
  // The dialog opens over the feature dialog, so it lives inside it while open.
  const host = graph.closest('dialog');
  if (host && full.parentElement !== host) host.append(full);
  fullFrom = graph;
  const title = full.querySelector('.tt-full__title');
  if (title) title.textContent = graph.dataset.title ?? '';
  body.replaceChildren(svg);
  full.showModal();
  requestAnimationFrame(() => resetView(body));
};

const addTools = (figure: HTMLElement, graph: HTMLElement) => {
  makePannable(graph);
  const tools = document.createElement('div');
  tools.className = 'tt-tools';
  tools.append(
    toolButton('Reset view (or double-click)', '↺', () => resetView(graph)),
    toolButton('Open full size', '⤢', () => openFull(graph)),
  );
  figure.prepend(tools);
};

let sequence = 0;
let queue: Promise<unknown> = Promise.resolve();

/** Draws one graph; renders run one after another (Mermaid keeps global state). */
const draw = (graph: HTMLElement, code: string) => {
  queue = queue.then(async () => {
    const mermaid = await loadMermaid();
    try {
      const out = await mermaid.render(`tt-mmd-${sequence++}`, code);
      graph.innerHTML = out.svg;
      const svg = graph.querySelector('svg');
      if (svg) {
        const view = svg.viewBox.baseVal;
        svg.dataset.w = String(view.width);
        svg.dataset.h = String(view.height);
        resetView(graph);
      }
      graph.dataset.rendered = 'true';
    } catch (error) {
      graph.textContent = `Mermaid error: ${String(error)}`;
      graph.dataset.rendered = 'error';
    }
  });
  return queue;
};

/** The heading a figure sits under, for the expand dialog's title. */
const headingBefore = (node: Element) => {
  let current: Element | null = node.previousElementSibling;
  while (current && !/^H[1-6]$/.test(current.tagName)) current = current.previousElementSibling;
  return current?.textContent?.trim() ?? 'Diagram';
};

/** A ```mermaid block (left as code by Shiki's excludeLangs) → a figure with tools. */
const toFigure = (pre: HTMLElement) => {
  const code = pre.textContent ?? '';
  const figure = document.createElement('figure');
  figure.className = 'tt-fig';
  const graph = document.createElement('div');
  graph.dataset.graph = 'tech';
  graph.dataset.title = headingBefore(pre);
  figure.append(graph);
  pre.replaceWith(figure);
  addTools(figure, graph);
  return { figure, graph, code };
};

/** Planned (the Modules diagram of tech.md) · Actual (review/deps.mmd), one at a time. */
const addToggle = (article: Element, planned: HTMLElement, folder: string) => {
  const template = document.querySelector<HTMLTemplateElement>(
    `template[data-actual-for="${folder}"]`,
  );
  if (!template) return;
  const caption = document.createElement('figcaption');
  caption.className = 'tt-fig__cap';
  caption.innerHTML = '<strong>Planned</strong> · by layer, from tech.md';
  planned.querySelector('.tt-tools')?.after(caption);
  const parts = [...template.content.cloneNode(true).childNodes].filter(
    (node): node is HTMLElement => node instanceof HTMLElement,
  );
  const toggle = document.createElement('div');
  toggle.className = 'tt-toggle';
  toggle.innerHTML =
    '<div class="tt-seg" role="group" aria-label="Graph"><button type="button" data-show="planned" aria-pressed="true">Planned</button><button type="button" data-show="actual" aria-pressed="false">Actual</button></div>';
  planned.before(toggle);
  planned.after(...parts);
  for (const part of parts) part.hidden = true;
  const actual = parts.find((part) => part.dataset.block === 'actual');
  const graph = actual?.querySelector<HTMLElement>('[data-graph]');
  const source = actual?.querySelector('[data-mmd]')?.textContent;
  if (actual && graph) addTools(actual, graph);
  let drawn = false;
  toggle.addEventListener('click', (event) => {
    const button = (event.target as Element).closest<HTMLElement>('button[data-show]');
    if (!button) return;
    const showActual = button.dataset.show === 'actual';
    for (const other of toggle.querySelectorAll('button'))
      other.setAttribute('aria-pressed', String(other === button));
    planned.hidden = showActual;
    for (const part of parts) part.hidden = !showActual;
    if (showActual && graph && source && !drawn) {
      drawn = true;
      draw(graph, source);
    }
    requestAnimationFrame(() => refitTech(article));
  });
};

/** First open of a feature's Tech tab: draw its diagrams. */
export const initTech = (dialog: Element) => {
  const article = dialog.querySelector<HTMLElement>('[data-tech]');
  if (!article || article.dataset.drawn) return;
  article.dataset.drawn = 'true';
  initFull();
  const blocks = [
    ...article.querySelectorAll<HTMLElement>('pre:has(> code.language-mermaid), pre.mermaid'),
  ];
  const figures = blocks.map(toFigure);
  const modules = article.querySelector('h2#modules');
  const planned = figures.find((entry) => {
    if (!modules) return false;
    let node: Element | null = modules.nextElementSibling;
    while (node && node.tagName !== 'H2') {
      if (node === entry.figure) return true;
      node = node.nextElementSibling;
    }
    return false;
  });
  if (planned) addToggle(article, planned.figure, article.dataset.tech ?? '');
  for (const entry of figures) draw(entry.graph, entry.code);
};
