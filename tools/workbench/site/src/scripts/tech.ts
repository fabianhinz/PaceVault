import type { Mermaid } from 'mermaid';

/**
 * The Tech tab (tech-tab round 3): Mermaid + ELK load on the first Tech open (Q4) and draw every
 * ```mermaid block of tech.md; each figure gets Fit · Zoom and a Full screen button (the full-screen
 * stage is the island's, `TechPane.tsx`). Sections without an actual side (Data flow, …) come
 * first as planned; then Modules, Components, Files (New / Changed) and Interfaces in that order
 * (R25), each with its own Planned | Actual switch (R28) in its frame's label row next to Reset and
 * Full screen (R29; also in the full-screen stage) over its actual side from `review/`.
 * DOM code on the pane element React hands over: `initTech` runs again after every new
 * `techHtml` and only draws blocks that are still code.
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
   trackpad pinch (a wheel event with ctrlKey); at full screen the plain wheel zooms. */
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

/**
 * Fits every not yet fitted diagram under `root` (it was hidden until now); `force` refits all
 * of them to the current width (the panel expanded or collapsed).
 */
export const refitTech = (root: Element, force = false) => {
  for (const box of root.querySelectorAll<HTMLElement>('[data-graph]')) {
    if (force) box.style.height = '';
    if (force || !views.has(box)) resetView(box);
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

/** A ghost icon button like the stage's (`Button ghost icon` with a lucide icon). */
const toolButton = (label: string, title: string, icon: string, onClick: () => void) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'tt-expand';
  button.title = title;
  button.setAttribute('aria-label', label);
  button.innerHTML = icon;
  button.addEventListener('click', onClick);
  return button;
};

/* ---------- full screen (TechPane's full-screen Stage): a diagram's svg, or any other frame's
   body (R32), moves in while open and back on close ---------- */

/** The diagram of a frame (its direct `[data-graph]`), or `undefined` for a list or code frame. */
export const graphIn = (frame: HTMLElement) =>
  frame.querySelector<HTMLElement>(':scope > [data-graph]') ?? undefined;

/** The nodes a non-diagram frame lent to the full-screen body, to put back on close. */
const lent = new WeakMap<HTMLElement, Element[]>();

/** The full-screen body opened: a diagram's svg moves in (pannable), else the frame's body. */
export const showFull = (body: HTMLElement, frame: HTMLElement) => {
  const graph = graphIn(frame);
  if (graph === undefined) {
    const nodes = [...frame.children].filter(
      (node) => !node.classList.contains('tt-fig__bar') && !node.classList.contains('tt-missing'),
    );
    lent.set(body, nodes);
    body.replaceChildren(...nodes);
    return;
  }
  if (!body.dataset.ready) {
    body.dataset.ready = 'true';
    makePannable(body);
  }
  const svg = graph.querySelector('svg');
  if (!svg) return;
  body.replaceChildren(svg);
  requestAnimationFrame(() => resetView(body));
};

/** Full screen closes: the svg (fitted again) or the lent body goes back to its frame. */
export const hideFull = (body: HTMLElement, frame: HTMLElement) => {
  const graph = graphIn(frame);
  if (graph === undefined) {
    const nodes = lent.get(body) ?? [];
    lent.delete(body);
    const bar = frame.querySelector(':scope > .tt-fig__bar');
    if (bar) bar.after(...nodes);
    else frame.prepend(...nodes);
    return;
  }
  const svg = body.querySelector('svg');
  if (!svg) return;
  graph.append(svg);
  resetView(graph);
};

/** Reset view button of the full-screen stage. */
export const resetFull = (body: HTMLElement) => resetView(body);

/** Opens a frame (a `.tt-fig`) in the full-screen stage. */
type Expand = (frame: HTMLElement) => void;

// lucide rotate-ccw and maximize-2, the icons of the full-screen stage's buttons
const icon = (paths: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
const RESET = icon(
  '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
);
const MAXIMIZE = icon(
  '<path d="M15 3h6v6"/><path d="m21 3-7 7"/><path d="m3 21 7-7"/><path d="M9 21H3v-6"/>',
);

/**
 * The figure's label row, as the collapsed `Stage` (Stage.tsx): label, muted path, the buttons
 * at its end. The actual graph brings its own row (`actualHtml`); the others get one here.
 */
const labelRow = (figure: HTMLElement, label: string, path: string) => {
  const existing = figure.querySelector<HTMLElement>(':scope > .tt-fig__bar');
  if (existing) return existing;
  const bar = document.createElement('div');
  bar.className = 'tt-fig__bar';
  const name = document.createElement('span');
  name.className = 'tt-fig__label';
  name.textContent = label;
  const where = document.createElement('span');
  where.className = 'tt-fig__path';
  where.textContent = path;
  bar.append(name, where);
  figure.prepend(bar);
  return bar;
};

const addTools = (figure: HTMLElement, graph: HTMLElement, expand: Expand) => {
  makePannable(graph);
  const tools = document.createElement('div');
  tools.className = 'tt-tools';
  tools.append(
    toolButton('Reset view', 'Reset view (or double-click)', RESET, () => resetView(graph)),
    toolButton('Full screen', 'Full screen', MAXIMIZE, () => expand(figure)),
  );
  labelRow(figure, 'Diagram', graph.dataset.title ?? '').append(tools);
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

/** The heading a figure sits under, for the full-screen stage's label row. */
const headingBefore = (node: Element) => {
  let current: Element | null = node.previousElementSibling;
  while (current && !/^H[1-6]$/.test(current.tagName)) current = current.previousElementSibling;
  return current?.textContent?.trim() ?? 'Diagram';
};

/** A ```mermaid block (`<pre class="mermaid">` from `renderTech`) → a figure with tools. */
const toFigure = (pre: HTMLElement, expand: Expand) => {
  const code = pre.textContent ?? '';
  const figure = document.createElement('figure');
  figure.className = 'tt-fig';
  const graph = document.createElement('div');
  graph.dataset.graph = 'tech';
  graph.dataset.title = headingBefore(pre);
  figure.append(graph);
  pre.replaceWith(figure);
  addTools(figure, graph, expand);
  return { figure, graph, code };
};

/** An H2 of the article by its text (marked writes no heading ids). */
const h2 = (article: Element, text: string) =>
  [...article.querySelectorAll(':scope > h2')].find(
    (heading) => heading.textContent?.trim() === text,
  );

/** The elements after `heading` up to the next H2 (its section). */
const sectionOf = (heading: Element | undefined) => {
  const nodes: HTMLElement[] = [];
  let node = heading?.nextElementSibling ?? null;
  while (node && node.tagName !== 'H2') {
    if (node instanceof HTMLElement) nodes.push(node);
    node = node.nextElementSibling;
  }
  return nodes;
};

/** The template's top-level elements whose block starts with `block`, cloned (an Actual side). */
const actualParts = (template: HTMLTemplateElement | null, block: string) =>
  [...(template?.content.cloneNode(true).childNodes ?? [])].filter(
    (node): node is HTMLElement =>
      node instanceof HTMLElement && (node.dataset.block ?? '').startsWith(block),
  );

/**
 * A switched frame's label row names only its source file (R34): no Planned / Actual overline,
 * no description; `tech.md` on the planned side, the `review/…` file on the actual side (its date
 * and base stay in the path's tooltip).
 */
const sourceOnly = (figure: HTMLElement, planned: boolean) => {
  figure.querySelector(':scope > .tt-fig__bar > .tt-fig__label')?.remove();
  const where = figure.querySelector<HTMLElement>(':scope > .tt-fig__bar > .tt-fig__path');
  if (!where) return;
  const full = where.textContent ?? '';
  if (planned) {
    where.textContent = 'tech.md';
    return;
  }
  const source = full.split(' · ')[0] ?? full;
  where.textContent = source;
  if (full !== source) where.title = full;
};

/**
 * A section with an actual side (R28, R29): one control for its planned and actual frames. The
 * switch sits first in each frame's label row (R31) and in the full-screen stage (`TechPane.tsx`
 * finds it by the frame with `controlOf`); `set` swaps the frames in place and resolves once a
 * newly shown diagram is drawn.
 */
export type SectionControl = {
  name: string;
  /** The command that writes the missing actual file; Actual is disabled meanwhile. */
  hint: string | undefined;
  isActual: () => boolean;
  set: (actual: boolean) => Promise<void>;
  /** The frame shown on a side, for the full-screen stage. */
  frameOf: (actual: boolean) => HTMLElement | undefined;
};

const controls = new WeakMap<HTMLElement, SectionControl>();

/** The section control a frame belongs to (the full-screen stage's switch). */
export const controlOf = (frame: HTMLElement) => controls.get(frame);

/** The command of a missing actual (the template's placeholder), or `undefined` when the file is there. */
const hintOf = (parts: HTMLElement[]) => {
  const command = parts
    .map((part) => part.querySelector('.tt-placeholder code')?.textContent)
    .find((text) => text !== undefined && text !== null);
  if (command === undefined || command === null) return undefined;
  return `Run ${command}`;
};

/** The frame's tool group at the end of its label row (created for frames without a diagram). */
const toolsOf = (figure: HTMLElement) => {
  const existing = figure.querySelector<HTMLElement>(':scope > .tt-fig__bar > .tt-tools');
  if (existing) return existing;
  const tools = document.createElement('div');
  tools.className = 'tt-tools';
  labelRow(figure, 'Planned', 'from tech.md').append(tools);
  return tools;
};

/** Every frame can open in the full-screen stage (R32): a Full screen button at the end of its label row. */
const addExpand = (frame: HTMLElement, expand: Expand) => {
  const tools = toolsOf(frame);
  if (tools.querySelector('[aria-label="Full screen"]')) return;
  tools.append(toolButton('Full screen', 'Full screen', MAXIMIZE, () => expand(frame)));
};

/** A compact Planned | Actual switch for a label row (R29), wired to `control`. */
const segment = (control: SectionControl) => {
  const seg = document.createElement('div');
  seg.className = 'tt-seg tt-seg--sm';
  seg.setAttribute('role', 'group');
  seg.setAttribute('aria-label', `${control.name}: planned or actual`);
  seg.innerHTML =
    '<button type="button" data-show="planned">Planned</button><button type="button" data-show="actual">Actual</button>';
  const actual = seg.querySelector<HTMLButtonElement>('button[data-show="actual"]');
  if (actual && control.hint !== undefined) {
    actual.disabled = true;
    actual.title = control.hint;
  }
  seg.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest<HTMLButtonElement>('button[data-show]');
    if (!button || button.disabled) return;
    void control.set(button.dataset.show === 'actual');
  });
  return seg;
};

/**
 * Builds a section's control: the actual parts go in after the planned ones, hidden; each frame
 * (the planned one and the actual one) gets the switch first in its label row; an actual Mermaid
 * graph gets its tools and is drawn on first show. With the actual file missing, Actual is
 * disabled and the planned frame says which command writes it.
 */
const sectionControl = (
  name: string,
  planned: HTMLElement[],
  parts: HTMLElement[],
  expand: Expand,
): SectionControl => {
  planned[planned.length - 1]?.after(...parts);
  for (const part of parts) part.hidden = true;
  const hint = hintOf(parts);
  const actualFigure = parts.find((part) => part.querySelector('[data-mmd]') !== null);
  const actualGraph = actualFigure?.querySelector<HTMLElement>('[data-graph]') ?? undefined;
  const source = actualFigure?.querySelector('[data-mmd]')?.textContent;
  if (actualFigure && actualGraph) addTools(actualFigure, actualGraph, expand);
  const plannedFigure = planned.find((node) => node.classList.contains('tt-fig'));
  let actualFrame: HTMLElement | undefined = undefined;
  if (hint === undefined) actualFrame = parts.find((part) => part.classList.contains('tt-fig'));
  let actual = false;
  let drawn = false;
  const segments: HTMLElement[] = [];
  const control: SectionControl = {
    name,
    hint,
    isActual: () => actual,
    frameOf: (side) => {
      if (side) return actualFrame;
      return plannedFigure;
    },
    set: async (side) => {
      actual = side;
      for (const node of planned) node.hidden = side;
      for (const part of parts) part.hidden = !side;
      for (const seg of segments) {
        for (const button of seg.querySelectorAll('button')) {
          button.setAttribute('aria-pressed', String((button.dataset.show === 'actual') === side));
        }
      }
      let drawing: Promise<unknown> = Promise.resolve();
      if (side && actualGraph && source && !drawn) {
        drawn = true;
        drawing = draw(actualGraph, source);
      }
      await drawing;
      const root = planned[0]?.parentElement;
      if (root) requestAnimationFrame(() => refitTech(root));
    },
  };
  for (const frame of [plannedFigure, actualFrame]) {
    if (frame === undefined) continue;
    const seg = segment(control);
    segments.push(seg);
    toolsOf(frame);
    frame.querySelector(':scope > .tt-fig__bar')?.prepend(seg);
    sourceOnly(frame, frame === plannedFigure);
    controls.set(frame, control);
  }
  if (plannedFigure && hint !== undefined) {
    const note = document.createElement('p');
    note.className = 'tt-missing';
    note.textContent = `No actual yet · ${hint}`;
    plannedFigure.append(note);
  }
  void control.set(false);
  return control;
};

/** The figure of `figures` that sits in `section`. */
const figureIn = (section: HTMLElement[], figures: HTMLElement[]) =>
  figures.find((figure) => section.includes(figure));

/** The index of the first `### New` / `### Changed` heading in a section, or -1. */
const firstFileHeading = (section: HTMLElement[]) =>
  section.findIndex(
    (node) => node.tagName === 'H3' && /^(New|Changed)$/.test(node.textContent?.trim() ?? ''),
  );

/**
 * The planned file lists: the body of `## Files` (the template since R25), or, in an older
 * tech.md, everything from the first `### New` / `### Changed` under `## Modules` on.
 */
const plannedFiles = (article: HTMLElement) => {
  const files = sectionOf(h2(article, 'Files'));
  if (files.length > 0) return files;
  const modules = sectionOf(h2(article, 'Modules'));
  const first = firstFileHeading(modules);
  if (first === -1) return [];
  return modules.slice(first);
};

/**
 * The sections with an actual side, from tech.md's headings: Modules (diagram ↔ `review/deps.mmd`
 * and the boundary check), Files (the planned lists as folder-grouped rows ↔ `review/files.json`,
 * R30), Interfaces (↔ `review/interfaces.md`) and Components (↔ `review/components.mmd`).
 */
const sectionControls = (
  article: HTMLElement,
  template: HTMLTemplateElement | null,
  figures: HTMLElement[],
  expand: Expand,
): SectionControl[] => {
  const sections: SectionControl[] = [];
  const modules = sectionOf(h2(article, 'Modules'));
  const modulesFigure = figureIn(modules, figures);
  if (modulesFigure) {
    const parts = [...actualParts(template, 'actual'), ...actualParts(template, 'check')];
    sections.push(sectionControl('Modules', [modulesFigure], parts, expand));
  }
  const files = plannedFiles(article);
  const filesPlanned = actualParts(template, 'files-planned')[0];
  if (files.length > 0 && filesPlanned) {
    files[0].before(filesPlanned);
    for (const node of files) node.remove();
    const parts = actualParts(template, 'files-actual');
    sections.push(sectionControl('Files', [filesPlanned], parts, expand));
  }
  const interfaces = h2(article, 'Interfaces');
  if (interfaces) {
    const planned = document.createElement('figure');
    planned.className = 'tt-fig tt-interfaces';
    planned.dataset.block = 'interfaces-planned';
    const code = document.createElement('div');
    code.className = 'tt-code';
    code.append(...sectionOf(interfaces));
    planned.append(code);
    labelRow(planned, 'Planned', 'from tech.md');
    interfaces.after(planned);
    const parts = actualParts(template, 'interfaces-actual');
    sections.push(sectionControl('Interfaces', [planned], parts, expand));
  }
  const componentsFigure = figureIn(sectionOf(h2(article, 'Components')), figures);
  if (componentsFigure) {
    const parts = actualParts(template, 'components-actual');
    sections.push(sectionControl('Components', [componentsFigure], parts, expand));
  }
  return sections;
};

/** An H2 and its section, or nothing when tech.md has no such heading. */
const sectionWithHeading = (article: HTMLElement, name: string): HTMLElement[] => {
  const heading = h2(article, name);
  if (!(heading instanceof HTMLElement)) return [];
  return [heading, ...sectionOf(heading)];
};

/**
 * Orders the tab (R24, R25): the plan-only sections (every other H2, e.g. Data flow) stay on top
 * in tech.md order; Modules, Components, Files and Interfaces follow in that fixed order, whatever
 * tech.md's order (a missing section is skipped). In an older tech.md, the Files frame moves out
 * of Modules under a "Files" heading. A new tech.md or Actual side mounts the article afresh, so
 * every switch starts again at Planned.
 */
const arrange = (article: HTMLElement) => {
  let modules = sectionWithHeading(article, 'Modules');
  let files = sectionWithHeading(article, 'Files');
  const first = modules.findIndex((node) => node.dataset.block === 'files-planned');
  if (files.length === 0 && first !== -1) {
    const heading = document.createElement('h2');
    heading.textContent = 'Files';
    files = [heading, ...modules.slice(first)];
    modules = modules.slice(0, first);
  }
  article.append(
    ...modules,
    ...sectionWithHeading(article, 'Components'),
    ...files,
    ...sectionWithHeading(article, 'Interfaces'),
  );
};

/**
 * Draws the diagrams of the pane's tech.md (`[data-tech]`), gives each section with an actual
 * side its control and orders the sections; on a DOM it already ran on (`data-ready`) it does
 * nothing. The pane's `template[data-actual]` holds every Actual side and the planned Files rows.
 */
export const initTech = (pane: Element, expand: Expand) => {
  const article = pane.querySelector<HTMLElement>('[data-tech]');
  if (!article || article.dataset.ready === 'true') return;
  article.dataset.ready = 'true';
  const blocks = [
    ...article.querySelectorAll<HTMLElement>('pre:has(> code.language-mermaid), pre.mermaid'),
  ];
  const figures = blocks.map((pre) => toFigure(pre, expand));
  const template = pane.querySelector<HTMLTemplateElement>('template[data-actual]');
  const sections = sectionControls(
    article,
    template,
    figures.map((entry) => entry.figure),
    expand,
  );
  if (sections.length > 0) arrange(article);
  for (const frame of article.querySelectorAll<HTMLElement>('.tt-fig')) addExpand(frame, expand);
  for (const entry of figures) draw(entry.graph, entry.code);
};
