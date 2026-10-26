import type { Token } from 'marked';
import { listItems, sectionTokens } from './frontmatter.ts';

export type TechPaths = { added: string[]; changed: string[] };

type TechEntry = { path: string; note: string };

const bulletEntries = (token: Token): TechEntry[] => {
  const entries: TechEntry[] = [];
  for (const item of listItems([token])) {
    const code = /`([^`]+)`/.exec(item.text);
    if (!code) continue;
    const note = item.text
      .slice(code.index + code[0].length)
      .replace(/^\s*[:—–-]?\s*/, '')
      .trim();
    entries.push({ path: code[1].trim(), note });
  }
  return entries;
};

const moduleEntries = ({ tech, heading }: { tech: string; heading: string }): TechEntry[] => {
  const entries: TechEntry[] = [];
  for (const section of ['Files', 'Modules']) {
    let inside = false;
    for (const token of sectionTokens({ text: tech, heading: section })) {
      if (token.type === 'heading') {
        inside = token.text.trim() === heading;
        continue;
      }
      if (!inside) continue;
      entries.push(...bulletEntries(token));
    }
  }
  return entries;
};

export const readTechEntries = (tech: string): { added: TechEntry[]; changed: TechEntry[] } => ({
  added: moduleEntries({ tech, heading: 'New' }),
  changed: moduleEntries({ tech, heading: 'Changed' }),
});

export const readTechPaths = (tech: string): TechPaths => {
  const entries = readTechEntries(tech);
  return {
    added: entries.added.map((entry) => entry.path),
    changed: entries.changed.map((entry) => entry.path),
  };
};
