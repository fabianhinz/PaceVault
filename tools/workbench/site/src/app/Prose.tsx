import { useMemo } from 'react';
import { Marked } from 'marked';
import { cn } from '@pacevault/ui/lib/cn.ts';

const escapeHtml = (text: string) =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

/** Inline markdown with raw HTML escaped, as the server's `renderMarkdown`. */
const inlineMd = new Marked({ renderer: { html: (token) => escapeHtml(token.text) } });

const inlineHtml = (markdown: string): string => {
  const out = inlineMd.parseInline(markdown);
  if (typeof out !== 'string') return escapeHtml(markdown);
  return out;
};

// React 19 sets innerHTML again for every new `__html` object: keep one per HTML string.

/** Markdown the server rendered (plan, guide), in the board's prose styles (`.wb-md`). */
export const Prose = (props: { html: string; className?: string }) => {
  const html = useMemo(() => ({ __html: props.html }), [props.html]);
  return <div className={cn('wb-md', props.className)} dangerouslySetInnerHTML={html} />;
};

/** One line of markdown from a list item (check, question, finding, `next:`), rendered here. */
export const Inline = (props: { markdown: string; className?: string }) => {
  const html = useMemo(() => ({ __html: inlineHtml(props.markdown) }), [props.markdown]);
  return <span className={cn('wb-inline', props.className)} dangerouslySetInnerHTML={html} />;
};
