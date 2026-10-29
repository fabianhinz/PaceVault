import type { Mermaid } from 'mermaid';
import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { PvSegmentedControl } from '@pacevault/ui/components/pvSegmentedControl/PvSegmentedControl.tsx';
import { tokens } from '@pacevault/ui/lib/tokens.ts';

let loading: Promise<Mermaid> | undefined = undefined;

const MERMAID_MAX_EDGES = 3000;
const MERMAID_MAX_TEXT_SIZE = 300000;

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
      maxEdges: MERMAID_MAX_EDGES,
      maxTextSize: MERMAID_MAX_TEXT_SIZE,
      themeVariables: {
        darkMode: true,
        background: tokens.surfaceSunken,
        primaryColor: tokens.surfaceElevated,
        primaryTextColor: tokens.textPrimary,
        primaryBorderColor: tokens.borderStrong,
        nodeTextColor: tokens.textPrimary,
        textColor: tokens.textSecondary,
        lineColor: tokens.textQuaternary,
        secondaryColor: tokens.surface,
        tertiaryColor: tokens.surface,
        clusterBkg: tokens.surface,
        clusterBorder: tokens.border,
        edgeLabelBackground: tokens.surfaceSunken,
        titleColor: tokens.textTertiary,
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        fontSize: '16px',
      },
      flowchart: { curve: 'basis', padding: 8, useMaxWidth: false },
    });
    return mermaid;
  })();
  return loading;
};

/*
 * The svg keeps its natural size and moves by a CSS transform inside a fixed box, so zooming
 * never shifts the page. Inline, plain wheel scrolls the page: zoom is Ctrl/⌘ + wheel or a
 * trackpad pinch (a wheel event with ctrlKey); at full screen the plain wheel zooms.
 */
type View = { scale: number; x: number; y: number; fit: number };
const views = new WeakMap<HTMLElement, View>();

const applyView = ({ box, view }: { box: HTMLElement; view: View }) => {
  views.set(box, view);
  const svg = box.querySelector<SVGSVGElement>('svg');
  if (svg) svg.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.scale})`;
};

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
  applyView({ box, view: { scale: fit, x, y, fit } });
};

export const refitTech = (root: Element, options: { force?: boolean } = {}) => {
  const force = options.force === true;
  for (const box of root.querySelectorAll<HTMLElement>('[data-graph]')) {
    if (force) box.style.height = '';
    if (force || !views.has(box)) resetView(box);
  }
};

const MIN_SCALE_PER_FIT = 0.5;
const MAX_SCALE = 8;
const WHEEL_ZOOM_RATE = 0.002;

const zoomAt = ({
  box,
  factor,
  clientX,
  clientY,
}: {
  box: HTMLElement;
  factor: number;
  clientX: number;
  clientY: number;
}) => {
  const view = views.get(box);
  if (!view) return;
  const scale = Math.min(Math.max(view.scale * factor, view.fit * MIN_SCALE_PER_FIT), MAX_SCALE);
  const rect = box.getBoundingClientRect();
  const pointerX = clientX - rect.left;
  const pointerY = clientY - rect.top;
  const ratio = scale / view.scale;
  applyView({
    box,
    view: {
      ...view,
      scale,
      x: pointerX - (pointerX - view.x) * ratio,
      y: pointerY - (pointerY - view.y) * ratio,
    },
  });
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
      zoomAt({
        box,
        factor: Math.exp(-event.deltaY * WHEEL_ZOOM_RATE),
        clientX: event.clientX,
        clientY: event.clientY,
      });
    },
    { passive: false },
  );
  let lastPointer: { x: number; y: number } | undefined = undefined;
  box.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || !views.has(box)) return;
    lastPointer = { x: event.clientX, y: event.clientY };
    box.setPointerCapture(event.pointerId);
    box.classList.add('is-panning');
  });
  box.addEventListener('pointermove', (event) => {
    const view = views.get(box);
    if (!lastPointer || !view) return;
    applyView({
      box,
      view: {
        ...view,
        x: view.x + event.clientX - lastPointer.x,
        y: view.y + event.clientY - lastPointer.y,
      },
    });
    lastPointer = { x: event.clientX, y: event.clientY };
  });
  const endPan = () => {
    lastPointer = undefined;
    box.classList.remove('is-panning');
  };
  box.addEventListener('pointerup', endPan);
  box.addEventListener('pointercancel', endPan);
  box.addEventListener('dblclick', () => resetView(box));
};

const toolButton = ({
  label,
  title,
  icon,
  onClick,
}: {
  label: string;
  title: string;
  icon: string;
  onClick: () => void;
}) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'tt-expand';
  button.title = title;
  button.setAttribute('aria-label', label);
  button.innerHTML = icon;
  button.addEventListener('click', onClick);
  return button;
};

export const graphIn = (frame: HTMLElement) =>
  frame.querySelector<HTMLElement>(':scope > [data-graph]') ?? undefined;

const lent = new WeakMap<HTMLElement, Element[]>();

export const showFull = ({ body, frame }: { body: HTMLElement; frame: HTMLElement }) => {
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

export const hideFull = ({ body, frame }: { body: HTMLElement; frame: HTMLElement }) => {
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

export const resetFull = (body: HTMLElement) => resetView(body);

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

const labelSpan = ({ className, text }: { className: string; text: string }): HTMLSpanElement => {
  const span = document.createElement('span');
  span.className = className;
  span.textContent = text;
  return span;
};

const labelRow = ({
  figure,
  label,
  path,
}: {
  figure: HTMLElement;
  label: string;
  path: string;
}) => {
  const existing = figure.querySelector<HTMLElement>(':scope > .tt-fig__bar');
  if (existing) return existing;
  const bar = document.createElement('div');
  bar.className = 'tt-fig__bar';
  bar.append(
    labelSpan({ className: 'tt-fig__label', text: label }),
    labelSpan({ className: 'tt-fig__path', text: path }),
  );
  figure.prepend(bar);
  return bar;
};

const addTools = ({
  figure,
  graph,
  expand,
}: {
  figure: HTMLElement;
  graph: HTMLElement;
  expand: Expand;
}) => {
  makePannable(graph);
  const tools = document.createElement('div');
  tools.className = 'tt-tools';
  tools.append(
    toolButton({
      label: 'Reset view',
      title: 'Reset view (or double-click)',
      icon: RESET,
      onClick: () => resetView(graph),
    }),
    toolButton({
      label: 'Full screen',
      title: 'Full screen',
      icon: MAXIMIZE,
      onClick: () => expand(figure),
    }),
  );
  labelRow({ figure, label: 'Diagram', path: graph.dataset.title ?? '' }).append(tools);
};

let sequence = 0;
let queue: Promise<unknown> = Promise.resolve();

/** Draws one graph; renders run one after another (Mermaid keeps global state). */
const drawGraph = ({ graph, code }: { graph: HTMLElement; code: string }) => {
  queue = queue.then(async () => {
    const mermaid = await loadMermaid();
    try {
      const rendered = await mermaid.render(`tt-mmd-${sequence++}`, code);
      graph.innerHTML = rendered.svg;
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

const headingBefore = (node: Element) => {
  let current: Element | null = node.previousElementSibling;
  while (current && !/^H[1-6]$/.test(current.tagName)) current = current.previousElementSibling;
  return current?.textContent?.trim() ?? 'Diagram';
};

const toFigure = ({ pre, expand }: { pre: HTMLElement; expand: Expand }) => {
  const code = pre.textContent ?? '';
  const figure = document.createElement('figure');
  figure.className = 'tt-fig';
  const graph = document.createElement('div');
  graph.dataset.graph = 'tech';
  graph.dataset.title = headingBefore(pre);
  figure.append(graph);
  pre.replaceWith(figure);
  addTools({ figure, graph, expand });
  return { figure, graph, code };
};

/** An H2 of the article by its text (marked writes no heading ids). */
const headingByText = ({ article, text }: { article: Element; text: string }) =>
  [...article.querySelectorAll(':scope > h2')].find(
    (heading) => heading.textContent?.trim() === text,
  );

const sectionOf = (heading: Element | undefined) => {
  const nodes: HTMLElement[] = [];
  let node = heading?.nextElementSibling ?? null;
  while (node && node.tagName !== 'H2') {
    if (node instanceof HTMLElement) nodes.push(node);
    node = node.nextElementSibling;
  }
  return nodes;
};

const actualParts = ({
  template,
  block,
}: {
  template: HTMLTemplateElement | null;
  block: string;
}) =>
  [...(template?.content.cloneNode(true).childNodes ?? [])].filter(
    (node): node is HTMLElement =>
      node instanceof HTMLElement && (node.dataset.block ?? '').startsWith(block),
  );

const sourceOnly = ({ figure, planned }: { figure: HTMLElement; planned: boolean }) => {
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

type SectionControl = {
  name: string;
  hint: string | undefined;
  isActual: () => boolean;
  set: (actual: boolean) => Promise<void>;
  frameOf: (actual: boolean) => HTMLElement | undefined;
};

const controls = new WeakMap<HTMLElement, SectionControl>();

export const controlOf = (frame: HTMLElement) => controls.get(frame);

const hintOf = (parts: HTMLElement[]) => {
  const command = parts
    .map((part) => part.querySelector('.tt-placeholder code')?.textContent)
    .find((text) => text !== undefined && text !== null);
  if (command === undefined || command === null) return undefined;
  return `Run ${command}`;
};

const toolsOf = (figure: HTMLElement) => {
  const existing = figure.querySelector<HTMLElement>(':scope > .tt-fig__bar > .tt-tools');
  if (existing) return existing;
  const tools = document.createElement('div');
  tools.className = 'tt-tools';
  labelRow({ figure, label: 'Planned', path: 'from tech.md' }).append(tools);
  return tools;
};

const addExpand = ({ frame, expand }: { frame: HTMLElement; expand: Expand }) => {
  const tools = toolsOf(frame);
  if (tools.querySelector('[aria-label="Full screen"]')) return;
  tools.append(
    toolButton({
      label: 'Full screen',
      title: 'Full screen',
      icon: MAXIMIZE,
      onClick: () => expand(frame),
    }),
  );
};

type SideSegment = {
  host: HTMLElement;
  render: (actual: boolean) => void;
};

// One React root per label-row switch; initTech unmounts the previous pane's roots before it
// rebuilds, so a refreshed Tech tab leaves none behind.
const segmentRoots: Root[] = [];

const unmountSegments = () => {
  const stale = segmentRoots.splice(0);
  // deferred: initTech runs inside a React effect, where a synchronous unmount warns
  queueMicrotask(() => {
    for (const root of stale) root.unmount();
  });
};

const sideValue = (actual: boolean) => {
  if (actual) return 'actual';
  return 'planned';
};

const segment = (control: SectionControl): SideSegment => {
  const host = document.createElement('div');
  host.className = '-my-1 mr-1';
  const root = createRoot(host);
  segmentRoots.push(root);
  const render = (actual: boolean) =>
    root.render(
      createElement(PvSegmentedControl, {
        size: 'sm',
        'aria-label': `${control.name}: planned or actual`,
        value: sideValue(actual),
        onValueChange: (side) => void control.set(side === 'actual'),
        options: [
          { value: 'planned', label: 'Planned' },
          {
            value: 'actual',
            label: 'Actual',
            disabled: control.hint !== undefined,
            tooltip: control.hint,
          },
        ],
      }),
    );
  render(false);
  return { host, render };
};

const actualSide = ({
  parts,
  expand,
}: {
  parts: HTMLElement[];
  expand: Expand;
}): {
  hint: string | undefined;
  figure: HTMLElement | undefined;
  graph: HTMLElement | undefined;
  source: string | null | undefined;
  frame: HTMLElement | undefined;
} => {
  const hint = hintOf(parts);
  const figure = parts.find((part) => part.querySelector('[data-mmd]') !== null);
  const graph = figure?.querySelector<HTMLElement>('[data-graph]') ?? undefined;
  const source = figure?.querySelector('[data-mmd]')?.textContent;
  if (figure && graph) addTools({ figure, graph, expand });
  let frame: HTMLElement | undefined = undefined;
  if (hint === undefined) frame = parts.find((part) => part.classList.contains('tt-fig'));
  return { hint, figure, graph, source, frame };
};

const wireSwitches = ({
  control,
  frames,
  segments,
  plannedFigure,
}: {
  control: SectionControl;
  frames: (HTMLElement | undefined)[];
  segments: SideSegment[];
  plannedFigure: HTMLElement | undefined;
}): void => {
  for (const frame of frames) {
    if (frame === undefined) continue;
    const handle = segment(control);
    segments.push(handle);
    toolsOf(frame);
    frame.querySelector(':scope > .tt-fig__bar')?.prepend(handle.host);
    sourceOnly({ figure: frame, planned: frame === plannedFigure });
    controls.set(frame, control);
  }
};

const sectionControl = ({
  name,
  planned,
  parts,
  expand,
}: {
  name: string;
  planned: HTMLElement[];
  parts: HTMLElement[];
  expand: Expand;
}): SectionControl => {
  planned[planned.length - 1]?.after(...parts);
  for (const part of parts) part.hidden = true;
  const actualFacts = actualSide({ parts, expand });
  const plannedFigure = planned.find((node) => node.classList.contains('tt-fig'));
  let actual = false;
  let drawn = false;
  const segments: SideSegment[] = [];
  const control: SectionControl = {
    name,
    hint: actualFacts.hint,
    isActual: () => actual,
    frameOf: (side) => {
      if (side) return actualFacts.frame;
      return plannedFigure;
    },
    set: async (side) => {
      actual = side;
      for (const node of planned) node.hidden = side;
      for (const part of parts) part.hidden = !side;
      for (const handle of segments) handle.render(side);
      let drawing: Promise<unknown> = Promise.resolve();
      if (side && actualFacts.graph && actualFacts.source && !drawn) {
        drawn = true;
        drawing = drawGraph({ graph: actualFacts.graph, code: actualFacts.source });
      }
      await drawing;
      const root = planned[0]?.parentElement;
      if (root) requestAnimationFrame(() => refitTech(root));
    },
  };
  wireSwitches({ control, frames: [plannedFigure, actualFacts.frame], segments, plannedFigure });
  if (plannedFigure && actualFacts.hint !== undefined) {
    const note = document.createElement('p');
    note.className = 'tt-missing';
    note.textContent = `No actual yet · ${actualFacts.hint}`;
    plannedFigure.append(note);
  }
  void control.set(false);
  return control;
};

const figureIn = ({ section, figures }: { section: HTMLElement[]; figures: HTMLElement[] }) =>
  figures.find((figure) => section.includes(figure));

const firstFileHeading = (section: HTMLElement[]) =>
  section.findIndex(
    (node) => node.tagName === 'H3' && /^(New|Changed)$/.test(node.textContent?.trim() ?? ''),
  );

const plannedFiles = (article: HTMLElement) => {
  const files = sectionOf(headingByText({ article, text: 'Files' }));
  if (files.length > 0) return files;
  const modules = sectionOf(headingByText({ article, text: 'Modules' }));
  const first = firstFileHeading(modules);
  if (first === -1) return [];
  return modules.slice(first);
};

const sectionControls = ({
  article,
  template,
  figures,
  expand,
}: {
  article: HTMLElement;
  template: HTMLTemplateElement | null;
  figures: HTMLElement[];
  expand: Expand;
}): SectionControl[] => {
  const sections: SectionControl[] = [];
  const modules = sectionOf(headingByText({ article, text: 'Modules' }));
  const modulesFigure = figureIn({ section: modules, figures });
  if (modulesFigure) {
    const parts = [
      ...actualParts({ template, block: 'actual' }),
      ...actualParts({ template, block: 'check' }),
    ];
    sections.push(sectionControl({ name: 'Modules', planned: [modulesFigure], parts, expand }));
  }
  const files = plannedFiles(article);
  const filesPlanned = actualParts({ template, block: 'files-planned' })[0];
  if (files.length > 0 && filesPlanned) {
    files[0].before(filesPlanned);
    for (const node of files) node.remove();
    const parts = actualParts({ template, block: 'files-actual' });
    sections.push(sectionControl({ name: 'Files', planned: [filesPlanned], parts, expand }));
  }
  const interfaces = headingByText({ article, text: 'Interfaces' });
  if (interfaces) {
    const planned = document.createElement('figure');
    planned.className = 'tt-fig tt-interfaces';
    planned.dataset.block = 'interfaces-planned';
    const code = document.createElement('div');
    code.className = 'tt-code';
    code.append(...sectionOf(interfaces));
    planned.append(code);
    labelRow({ figure: planned, label: 'Planned', path: 'from tech.md' });
    interfaces.after(planned);
    const parts = actualParts({ template, block: 'interfaces-actual' });
    sections.push(sectionControl({ name: 'Interfaces', planned: [planned], parts, expand }));
  }
  const componentsFigure = figureIn({
    section: sectionOf(headingByText({ article, text: 'Components' })),
    figures,
  });
  if (componentsFigure) {
    const parts = actualParts({ template, block: 'components-actual' });
    sections.push(
      sectionControl({ name: 'Components', planned: [componentsFigure], parts, expand }),
    );
  }
  return sections;
};

const sectionWithHeading = ({
  article,
  name,
}: {
  article: HTMLElement;
  name: string;
}): HTMLElement[] => {
  const heading = headingByText({ article, text: name });
  if (!(heading instanceof HTMLElement)) return [];
  return [heading, ...sectionOf(heading)];
};

const arrange = (article: HTMLElement) => {
  let modules = sectionWithHeading({ article, name: 'Modules' });
  let files = sectionWithHeading({ article, name: 'Files' });
  const first = modules.findIndex((node) => node.dataset.block === 'files-planned');
  if (files.length === 0 && first !== -1) {
    const heading = document.createElement('h2');
    heading.textContent = 'Files';
    files = [heading, ...modules.slice(first)];
    modules = modules.slice(0, first);
  }
  article.append(
    ...modules,
    ...sectionWithHeading({ article, name: 'Components' }),
    ...files,
    ...sectionWithHeading({ article, name: 'Interfaces' }),
  );
};

export const initTech = ({ pane, expand }: { pane: Element; expand: Expand }) => {
  const article = pane.querySelector<HTMLElement>('[data-tech]');
  if (!article || article.dataset.ready === 'true') return;
  article.dataset.ready = 'true';
  unmountSegments();
  const blocks = [
    ...article.querySelectorAll<HTMLElement>('pre:has(> code.language-mermaid), pre.mermaid'),
  ];
  const figures = blocks.map((pre) => toFigure({ pre, expand }));
  const template = pane.querySelector<HTMLTemplateElement>('template[data-actual]');
  const sections = sectionControls({
    article,
    template,
    figures: figures.map((entry) => entry.figure),
    expand,
  });
  if (sections.length > 0) arrange(article);
  for (const frame of article.querySelectorAll<HTMLElement>('.tt-fig'))
    addExpand({ frame, expand });
  for (const entry of figures) void drawGraph({ graph: entry.graph, code: entry.code });
};
