/*
 * Board keys from inside a Mockup/Review iframe: Esc, [ and ] (no modifiers, not while typing)
 * go to the board via postMessage({ wbKey }), which closes the dialog or switches the card.
 * A page opened on its own (no parent frame) does nothing. mockup-shell.js carries the same
 * logic for mockups; review pages include this file.
 */
(() => {
  if (window.parent === window) return;
  const KEYS = ['Escape', '[', ']'];
  addEventListener('keydown', (e) => {
    if (!KEYS.includes(e.key) || e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
    if (
      e.target.closest?.(
        'input, textarea, select, [contenteditable]:not([contenteditable="false"])',
      )
    )
      return;
    // Esc belongs to a dialog the page itself has open
    if (e.key === 'Escape' && document.querySelector('dialog[open]')) return;
    window.parent.postMessage({ wbKey: e.key }, '*');
  });
})();
