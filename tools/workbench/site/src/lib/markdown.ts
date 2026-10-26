import { Marked, type Token, type Tokens } from 'marked';
import { createHighlighter, type Highlighter } from 'shiki';
import { escapeHtml } from './html.ts';

export const syncHtml = (html: string | Promise<string>): string => {
  if (typeof html !== 'string') throw new Error('marked returned a promise (async extension?)');
  return html;
};

const escapedHtml = (token: Tokens.HTML | Tokens.Tag): string => {
  if (token.block) return `<p>${escapeHtml(token.text.trim())}</p>\n`;
  return escapeHtml(token.text);
};

// A literal `<table>` can only come from the table renderer: raw HTML and code are escaped.
const wrapTables = (html: string): string =>
  html
    .replaceAll('<table>', '<div class="wb-table"><table>')
    .replaceAll('</table>', '</table></div>');

export const renderMarkdown = (markdown: string): string => {
  const leads = new WeakSet<Token>();
  let leadTaken = false;
  const planMarked: Marked = new Marked({
    gfm: true,
    walkTokens: (token) => {
      if (token.type !== 'heading') return;
      const heading = token as Tokens.Heading;
      if (heading.depth === 1 && !leadTaken) {
        leads.add(token);
        leadTaken = true;
      }
      heading.depth = Math.min(heading.depth + 1, 6);
    },
    renderer: {
      heading: (token): string | false => {
        if (!leads.has(token)) return false;
        return `<p class="wb-md__lead">${syncHtml(planMarked.parseInline(token.text))}</p>\n`;
      },
      html: escapedHtml,
    },
    hooks: { postprocess: wrapTables },
  });
  return syncHtml(planMarked.parse(markdown));
};

const TECH_LANGS = ['ts', 'tsx', 'js', 'json', 'bash'];

let highlighting: Promise<Highlighter> | undefined = undefined;

/** One Shiki highlighter for the dev server's lifetime (creating one costs ~100 ms). */
const highlighter = () => {
  if (highlighting === undefined) {
    highlighting = createHighlighter({ themes: ['github-dark'], langs: TECH_LANGS });
  }
  return highlighting;
};

const plainCode = (code: string) => `<pre><code>${escapeHtml(code)}</code></pre>\n`;

export const renderTech = async (markdown: string): Promise<string> => {
  const shiki = await highlighter();
  const loaded = new Set(shiki.getLoadedLanguages());
  const techMarked = new Marked({
    gfm: true,
    renderer: {
      code: (token) => {
        const lang = (token.lang ?? '').trim().split(/\s+/)[0];
        if (lang === 'mermaid') return `<pre class="mermaid">${escapeHtml(token.text)}</pre>\n`;
        if (lang === '' || !loaded.has(lang)) return plainCode(token.text);
        return `${shiki.codeToHtml(token.text, { lang, theme: 'github-dark' })}\n`;
      },
      html: escapedHtml,
    },
    hooks: { postprocess: wrapTables },
  });
  return syncHtml(techMarked.parse(markdown));
};
