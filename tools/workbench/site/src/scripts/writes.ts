import { actions } from 'astro:actions';
import type { Change, FolderChange, WriteResult } from '../actions/index.ts';

/**
 * Write-back in the browser: every `form[data-action]` goes to its Astro Action as FormData
 * (never a plain POST: the dev reload would resend it). After a write the dev server's file
 * watcher reloads the page; the open dialog, its tab and scroll come back without the open
 * transition (also after a reload caused by an agent's edit), and the toast shows the diff with
 * Undo (Q12). A 409 (the file changed since) reloads the board.
 */

type ActionFailure = { code?: string; message: string; fields?: Record<string, string[]> };
type ActionReply = { data?: WriteResult; error?: ActionFailure };
type Call = (input: unknown) => Promise<ActionReply>;

const callFor = (name: string): Call | undefined => {
  let node: unknown = actions;
  for (const part of name.split('.')) {
    if (node === null || (typeof node !== 'object' && typeof node !== 'function')) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  if (typeof node !== 'function') return undefined;
  return node as Call;
};

const UI = 'wb-ui';
const WRITE = 'wb-write';
const ERROR = 'wb-error';

const remember = () => {
  const dialog = document.querySelector<HTMLDialogElement>('dialog[open][data-bucket]');
  if (!dialog) {
    sessionStorage.removeItem(UI);
    return;
  }
  const tab = dialog.querySelector<HTMLInputElement>('.wb-tab:checked')?.dataset.tab;
  const pane = dialog.querySelector<HTMLElement>(`.wb-pane--${tab ?? 'plan'}`);
  const scroll =
    pane?.querySelector<HTMLElement>('.wbx-findings')?.scrollTop ?? pane?.scrollTop ?? 0;
  sessionStorage.setItem(UI, JSON.stringify({ dialog: dialog.id, tab, scroll }));
};

const reloadSoon = () => {
  // the file watcher reloads first; this covers a write it did not see
  setTimeout(() => location.reload(), 2500);
};

/** The toast sits inside the open modal dialog, so it is not inert, or on the page. */
const TOAST_MS = 12000;

const showToast = (ms = TOAST_MS) => {
  const toast = document.getElementById('wbx-toast');
  if (!toast) return undefined;
  const host = [...document.querySelectorAll('dialog[open]')].at(-1) ?? document.body;
  if (toast.parentElement !== host) host.append(toast);
  if (toast.matches(':popover-open')) toast.hidePopover();
  toast.showPopover();
  armTimer(toast, ms);
  return toast;
};

let timer = 0;
/** Closes after 12 s (also across reloads); hovering keeps it open. */
const armTimer = (toast: HTMLElement, ms: number) => {
  clearTimeout(timer);
  timer = window.setTimeout(() => {
    if (toast.matches(':hover')) armTimer(toast, 2000);
    else if (toast.matches(':popover-open')) toast.hidePopover();
  }, ms);
};

/** The last write stays undoable while its toast is up, also after a reload in between. */
type Stored = { result: WriteResult; until: number };

const element = (tag: string, className: string, text: string) => {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
};

const diffBox = (head: string[], body: string[]) => {
  const box = element('div', 'wbx-diff', '');
  for (const line of [...head, ...body]) {
    let kind = '';
    if (line.startsWith('--- ') || line.startsWith('+++ ')) kind = 'is-file';
    else if (line.startsWith('@@')) kind = 'is-hunk';
    else if (line.startsWith('+')) kind = 'is-add';
    else if (line.startsWith('-')) kind = 'is-del';
    let text = line;
    if (text === '') text = ' ';
    box.append(element('div', kind, text));
  }
  return box;
};

const changeBox = (change: Change) =>
  diffBox(
    [
      `--- a/tools/workbench/backlog/${change.path}`,
      `+++ b/tools/workbench/backlog/${change.path}`,
    ],
    change.diff.split('\n'),
  );

/** A removed or restored folder: the list of its files. */
const folderBox = (folder: FolderChange) => {
  const path = `tools/workbench/backlog/${folder.folder}/`;
  if (folder.state === 'deleted') {
    return diffBox(
      [`--- a/${path}`, '+++ /dev/null'],
      folder.files.map((file) => `- ${file}`),
    );
  }
  return diffBox(
    ['--- /dev/null', `+++ b/${path}`],
    folder.files.map((file) => `+ ${file}`),
  );
};

const toastWrite = (result: WriteResult, ms = TOAST_MS) => {
  const toast = showToast(ms);
  if (!toast) return;
  const files = toast.querySelector('#wbx-toast-files');
  const paths = result.changes.map((change) => `tools/workbench/backlog/${change.path}`);
  const boxes = result.changes.map(changeBox);
  if (result.folder) {
    paths.push(`tools/workbench/backlog/${result.folder.folder}/`);
    boxes.push(folderBox(result.folder));
  }
  files?.replaceChildren(...paths.map((path) => element('code', '', path)));
  const act = toast.querySelector('#wbx-toast-act');
  if (act) act.textContent = result.name;
  toast.querySelector('#wbx-toast-diffs')?.replaceChildren(...boxes);
  const foot = toast.querySelector('#wbx-toast-foot');
  if (!foot) return;
  foot.replaceChildren();
  if (result.name.startsWith('undo ')) foot.append(element('span', '', 'Undone.'));
  else {
    const undo = element('button', 'wb-btn wb-btn--xs', 'Undo');
    undo.setAttribute('type', 'button');
    undo.addEventListener('click', () => runUndo(result, undo));
    foot.append(undo);
  }
  const notes = element('span', 'wbx-grow', '');
  for (const note of result.notes) notes.append(element('span', 'wbx-warn', `${note} `));
  foot.append(notes);
};

const toastError = (message: string) => {
  const toast = showToast();
  if (!toast) return;
  toast.querySelector('#wbx-toast-files')?.replaceChildren();
  const act = toast.querySelector('#wbx-toast-act');
  if (act) act.textContent = '';
  toast.querySelector('#wbx-toast-diffs')?.replaceChildren();
  toast
    .querySelector('#wbx-toast-foot')
    ?.replaceChildren(element('span', 'wbx-toast__err', message));
};

const runUndo = (result: WriteResult, button: HTMLElement) => {
  const changes = result.changes.map((change) => ({
    path: change.path,
    before: change.before,
    after: change.after,
  }));
  runAction(
    'undo',
    { name: result.name, changes, folder: result.folder?.folder },
    undefined,
    button,
  );
};

/** Writes after which the dialog does not come back: its card left the board. */
const CLOSES = ['item.delete'];
/** Set by such a write, so the remember() before the reload does not bring the dialog back. */
let closing = false;

const done = (result: WriteResult) => {
  remember();
  if (CLOSES.includes(result.name)) {
    closing = true;
    sessionStorage.removeItem(UI);
  }
  const stored: Stored = { result, until: Date.now() + TOAST_MS };
  sessionStorage.setItem(WRITE, JSON.stringify(stored));
  reloadSoon();
};

/** Input errors list the field messages instead of the raw validation dump. */
const messageOf = (error: ActionFailure) => {
  if (error.fields) return Object.values(error.fields).flat().join(' ');
  return error.message;
};

const fail = (form: HTMLFormElement | undefined, error: ActionFailure) => {
  if (error.code === 'CONFLICT') {
    remember();
    sessionStorage.setItem(ERROR, error.message);
    location.reload();
    return;
  }
  const hint = form?.querySelector<HTMLElement>('.wb-hint');
  if (hint) {
    hint.textContent = messageOf(error);
    hint.classList.add('is-error');
    return;
  }
  toastError(messageOf(error));
};

/** Runs one write action; `form` gets the error hint. Exported for drag and drop. */
/* One write at a time. The control that started it shows busy and stays disabled until the
   page reloads after the write (the file watcher takes ~0.7 s; the action itself ~50 ms), or
   until an error comes back; further writes are ignored meanwhile. */
let pending = false;
let busyControl: HTMLElement | undefined = undefined;

const startBusy = (control: HTMLElement | undefined) => {
  pending = true;
  busyControl = control;
  document.body.classList.add('wbx-busy');
  if (!control) return;
  control.classList.add('is-busy');
  control.setAttribute('aria-busy', 'true');
  if (control instanceof HTMLButtonElement) control.disabled = true;
};

const endBusy = () => {
  pending = false;
  document.body.classList.remove('wbx-busy');
  const control = busyControl;
  busyControl = undefined;
  if (!control) return;
  control.classList.remove('is-busy');
  control.removeAttribute('aria-busy');
  if (control instanceof HTMLButtonElement) control.disabled = false;
};

/** Runs one write action; `form` gets the error hint, `control` the busy state. */
export const runAction = async (
  name: string,
  input: unknown,
  form?: HTMLFormElement,
  control?: HTMLElement,
) => {
  const call = callFor(name);
  if (!call || pending) return;
  startBusy(control);
  let reply: ActionReply;
  try {
    reply = await call(input);
  } catch (error) {
    endBusy();
    toastError(String(error));
    return;
  }
  if (reply.error) {
    endBusy();
    fail(form, reply.error);
  } else if (reply.data) done(reply.data);
  else endBusy();
};

/**
 * Drag an item card onto a column for its status (Q9 b): only the statuses in its
 * `data-moves` take it (done only from in-review, a done card only back to in-review), the
 * others are dimmed, and only the column under the pointer is marked.
 */
const initDrag = () => {
  let dragged: HTMLElement | undefined = undefined;
  const clear = () => {
    for (const node of document.querySelectorAll('.is-drop')) node.classList.remove('is-drop');
  };
  const accepts = (card: HTMLElement, column: HTMLElement) =>
    (card.dataset.moves ?? '').split(' ').includes(column.dataset.col ?? '');
  /** The column a dragged card may land on, or undefined. */
  const targetAt = (card: HTMLElement, target: EventTarget | null) => {
    const column = (target as Element | null)?.closest?.<HTMLElement>('[data-col]');
    if (!column || !accepts(card, column)) return undefined;
    return column;
  };
  addEventListener('dragstart', (event) => {
    const card = (event.target as Element).closest?.<HTMLElement>('.wb-card[data-item]');
    if (!card) return;
    dragged = card;
    event.dataTransfer?.setData('text/plain', card.dataset.item ?? '');
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
    card.classList.add('is-dragging');
    for (const column of document.querySelectorAll<HTMLElement>('[data-col]')) {
      if (!accepts(card, column)) column.classList.add('is-blocked');
    }
  });
  addEventListener('dragend', () => {
    dragged?.classList.remove('is-dragging');
    dragged = undefined;
    clear();
    for (const node of document.querySelectorAll('.is-blocked'))
      node.classList.remove('is-blocked');
  });
  addEventListener('dragover', (event) => {
    if (!dragged) return;
    const column = targetAt(dragged, event.target);
    clear();
    if (!column) return;
    event.preventDefault();
    column.classList.add('is-drop');
  });
  addEventListener('drop', (event) => {
    const card = dragged;
    if (!card) return;
    const column = targetAt(card, event.target);
    if (!column) return;
    event.preventDefault();
    clear();
    const data = new FormData();
    data.set('item', card.dataset.item ?? '');
    data.set('expected', card.dataset.statusLine ?? '');
    data.set('to', column.dataset.col ?? '');
    runAction('plan.setStatus', data, undefined, card);
  });
};

export const initWrites = () => {
  addEventListener('submit', (event) => {
    const form = event.target as HTMLFormElement;
    const submitter = event.submitter as HTMLElement | null;
    const name = submitter?.dataset.action ?? form.dataset.action;
    if (name === undefined) return;
    event.preventDefault();
    if (pending) return;
    const data = new FormData(form);
    const expected = submitter?.dataset.expected;
    if (expected !== undefined) data.set('expected', expected);
    const control =
      submitter ?? form.querySelector<HTMLElement>('button[type=submit]') ?? undefined;
    runAction(name, data, form, control);
  });
  addEventListener('click', (event) => {
    const target = event.target as Element;
    const quick = target.closest<HTMLElement>('[data-quick]');
    const input = quick?.closest('form')?.querySelector<HTMLInputElement>('input[name="words"]');
    if (quick && input) {
      input.value = quick.dataset.quick ?? '';
      input.focus();
      return;
    }
    if (target.closest('[data-toast-close]')) document.getElementById('wbx-toast')?.hidePopover();
  });
  initDrag();
  // dev server: every reload (a board write or an agent's file edit) keeps the open dialog
  import.meta.hot?.on('vite:beforeFullReload', () => {
    if (!closing) remember();
  });
};

type Remembered = { dialog?: string; tab?: string; scroll?: number };

/** After a reload: the dialog that was open, its tab and scroll, then the write's toast. */
export const restoreAfterReload = (loadPane: (dialog: Element | null) => void) => {
  let ui: Remembered = {};
  try {
    ui = JSON.parse(sessionStorage.getItem(UI) ?? '{}') as Remembered;
  } catch {
    ui = {};
  }
  sessionStorage.removeItem(UI);
  const dialog = document.getElementById(ui.dialog ?? '');
  if (dialog instanceof HTMLDialogElement) {
    const radio = dialog.querySelector<HTMLInputElement>(
      `.wb-tab[data-tab="${ui.tab}"]:not(:disabled)`,
    );
    if (radio) radio.checked = true;
    // no open transition: the dialog was open before the reload (as the bucket switch, board.ts)
    const html = document.documentElement;
    html.classList.add('wb-swap');
    dialog.showModal();
    // resolve the styles now, with the transitions off, so the open state is the starting style
    dialog.getBoundingClientRect();
    requestAnimationFrame(() => html.classList.remove('wb-swap'));
    loadPane(dialog);
    const pane = dialog.querySelector<HTMLElement>(`.wb-pane--${ui.tab ?? 'plan'}`);
    const box = pane?.querySelector<HTMLElement>('.wbx-findings') ?? pane;
    if (box) box.scrollTop = ui.scroll ?? 0;
  }
  const write = sessionStorage.getItem(WRITE);
  if (write !== null) {
    try {
      const stored = JSON.parse(write) as Stored;
      const left = stored.until - Date.now();
      if (left > 0) toastWrite(stored.result, left);
      else sessionStorage.removeItem(WRITE);
    } catch {
      sessionStorage.removeItem(WRITE);
    }
  }
  document.getElementById('wbx-toast')?.addEventListener('toggle', (event) => {
    if ((event as ToggleEvent).newState === 'closed') sessionStorage.removeItem(WRITE);
  });
  const error = sessionStorage.getItem(ERROR);
  sessionStorage.removeItem(ERROR);
  if (error !== null) toastError(error);
};
