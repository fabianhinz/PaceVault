import { useMemo, type FC } from 'react';
import { Marked } from 'marked';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { escapeHtml } from '@site/lib/html.ts';

const inlineMd = new Marked({ renderer: { html: (token) => escapeHtml(token.text) } });

const inlineHtml = (markdown: string): string => {
  const rendered = inlineMd.parseInline(markdown);
  if (typeof rendered !== 'string') return escapeHtml(markdown);
  return rendered;
};

interface InlineProps {
  markdown: string;
  className?: string;
}

// React 19 sets innerHTML again for every new `__html` object: keep one per HTML string.

export const Inline: FC<InlineProps> = (props) => {
  const html = useMemo(() => ({ __html: inlineHtml(props.markdown) }), [props.markdown]);
  return <span className={cn('wb-inline', props.className)} dangerouslySetInnerHTML={html} />;
};
