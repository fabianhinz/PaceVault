import { initTech, refitTech } from './tech.ts';
import { initWrites, restoreAfterReload } from './writes.ts';

/**
 * The board's browser side. Dialogs are native `<dialog>`s opened by Invoker Commands; this
 * file adds the fallback, lazy iframes, the column navigation ([ ] and the peeks, also from
 * inside an iframe), the Tech tab, and the write-back (writes.ts).
 */

/* Fallback only where native support is missing.
   Invoker Commands (commandfor/command): Chrome/Edge 135+, Firefox 144+, Safari 26.2+.
   <dialog closedby>: Chrome/Edge 134+, Firefox 141+; Safari: not supported at time of writing. */
type Opened = HTMLDialogElement & { wbOpener?: HTMLElement | null };

if (!('commandForElement' in HTMLButtonElement.prototype)) {
  addEventListener('click', (event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>('button[commandfor]');
    const target = button && document.getElementById(button.getAttribute('commandfor') ?? '');
    if (!button || !(target instanceof HTMLDialogElement)) return;
    if (button.getAttribute('command') === 'show-modal') {
      (target as Opened).wbOpener = button;
      if (!target.open) target.showModal();
    } else target.close();
  });
}
if (!('closedBy' in HTMLDialogElement.prototype)) {
  addEventListener('click', (event) => {
    const target = event.target;
    if (target instanceof HTMLDialogElement && target.open) target.close();
  });
}
addEventListener('close', (event) => (event.target as Opened).wbOpener?.focus(), true);

const checkedTab = (dialog: Element) =>
  dialog.querySelector<HTMLInputElement>('.wb-tab:checked')?.dataset.tab;

/** Loads the iframe of the checked tab (first time only) and draws the Tech tab on first open. */
export const loadPane = (dialog: Element | null) => {
  if (!dialog) return;
  const tab = checkedTab(dialog);
  if (tab === undefined) return;
  const frame = dialog.querySelector<HTMLIFrameElement>(
    `.wb-pane--${tab} iframe[data-src]:not([src])`,
  );
  if (frame?.dataset.src) frame.src = frame.dataset.src;
  if (tab === 'tech') initTech(dialog);
  requestAnimationFrame(() => refitTech(dialog));
};

addEventListener('change', (event) => {
  const target = event.target as Element;
  if (target.matches('.wb-tab')) loadPane(target.closest('dialog'));
});
addEventListener(
  'toggle',
  (event) => {
    const target = event.target as Element;
    if (target.matches('dialog[data-bucket]') && (event as ToggleEvent).newState === 'open') {
      loadPane(target);
    }
  },
  true,
);

/* Column navigation: the peeks (data-step) and [ / ] switch to the previous/next dialog of the
   same column, keeping the tab when the target has it. One modal at a time. */
const go = (dialog: HTMLDialogElement, step: number) => {
  const list = [
    ...document.querySelectorAll<HTMLDialogElement>(
      `dialog[data-bucket="${dialog.dataset.bucket}"]`,
    ),
  ];
  if (list.length < 2) return;
  const next = list[(list.indexOf(dialog) + step + list.length) % list.length];
  const tab = checkedTab(dialog);
  const radio =
    next.querySelector<HTMLInputElement>(`.wb-tab[data-tab="${tab}"]:not(:disabled)`) ??
    next.querySelector<HTMLInputElement>('.wb-tab:checked');
  if (radio) radio.checked = true;
  (next as Opened).wbOpener = document.querySelector<HTMLElement>(
    `.wb-card[commandfor="${next.id}"]`,
  );
  const html = document.documentElement;
  const swap = () => {
    dialog.close();
    next.showModal();
    loadPane(next);
    next.querySelector<HTMLElement>('.wb-tab:checked')?.focus();
  };
  html.classList.add('wb-swap');
  if (document.startViewTransition) {
    document.startViewTransition(swap).finished.finally(() => html.classList.remove('wb-swap'));
  } else {
    swap();
    requestAnimationFrame(() => html.classList.remove('wb-swap'));
  }
};

addEventListener('click', (event) => {
  const target = event.target as Element;
  const peek = target.closest<HTMLElement>('[data-step]');
  const dialog = peek?.closest('dialog');
  if (peek && dialog) go(dialog, Number(peek.dataset.step));
  else if (target instanceof HTMLDialogElement && target.matches('[data-bucket]') && target.open) {
    target.close(); // the gap around panel and peeks
  }
});

/** The bucket dialog the keys act on; none while an answer dialog or a diagram is open on top. */
const keyTarget = () => {
  if (document.querySelector('.wbx-adlg[open], .tt-full[open]')) return undefined;
  return document.querySelector<HTMLDialogElement>('dialog[open][data-bucket]') ?? undefined;
};
const key = (name: string) => {
  const dialog = keyTarget();
  if (!dialog) return;
  if (name === 'Escape') dialog.close();
  else if (name === ']') go(dialog, 1);
  else go(dialog, -1);
};
addEventListener('keydown', (event) => {
  if ((event.key !== '[' && event.key !== ']') || event.metaKey || event.ctrlKey || event.altKey)
    return;
  const typing =
    'input:not([type=radio]):not([type=checkbox]), textarea, select, [contenteditable]';
  if ((event.target as Element).closest?.(typing)) return;
  key(event.key);
});
/* Keys pressed inside a Mockup/Review iframe arrive from _shared/frame-keys.js. */
addEventListener('message', (event) => {
  const name = (event.data as { wbKey?: unknown } | null)?.wbKey;
  if (name !== 'Escape' && name !== '[' && name !== ']') return;
  const frames = [...document.querySelectorAll<HTMLIFrameElement>('.wb-pane iframe')];
  if (frames.some((frame) => frame.contentWindow === event.source)) key(name);
});

/* "Decided by agents": a collapsed Inbox group. */
addEventListener('click', (event) => {
  const toggle = (event.target as Element).closest<HTMLButtonElement>('[data-agents-toggle]');
  if (!toggle) return;
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', String(open));
  let mark = '▸';
  if (open) mark = '▾';
  toggle.textContent = toggle.textContent?.replace(/^[▸▾]/, mark) ?? '';
  for (const card of document.querySelectorAll<HTMLElement>('.wbx-agent-card')) card.hidden = !open;
});

initWrites();
restoreAfterReload(loadPane);
