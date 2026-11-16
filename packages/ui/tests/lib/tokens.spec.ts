import { describe, expect, it } from 'vite-plus/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { TOKENS_BY_THEME, fontSizes } from '../../src/lib/tokens.ts';

const themeVariables = (source: string): Map<string, string> => {
  const variables = new Map<string, string>();
  for (const match of source.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) {
    const name = match[1];
    const value = match[2];
    if (name !== undefined && value !== undefined) variables.set(name, value.trim());
  }
  return variables;
};

const kebab = (key: string): string => key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

const resolveVariable = (variables: Map<string, string>, name: string): string | undefined => {
  const value = variables.get(name);
  const reference = value?.match(/^var\(--([a-z0-9-]+)\)$/)?.[1];
  if (reference === undefined) return value;
  return variables.get(reference);
};

const source = readFileSync(resolve(import.meta.dirname, '../../src/theme.css'), 'utf8');

const blockSource = (selector: string): string => {
  const start = source.indexOf(`${selector} {`);
  return source.slice(start, source.indexOf('}', start));
};

const variables = themeVariables(blockSource('@theme'));
const variablesUnder = (selector: string): Map<string, string> =>
  new Map([...variables, ...themeVariables(blockSource(selector))]);

const variablesByTheme = {
  base: variables,
  dark: variablesUnder("[data-theme='dark']"),
  light: variablesUnder("[data-theme='light']"),
};

describe('tokens', () => {
  it('every colour token mirrors its CSS variable in each theme', () => {
    for (const theme of ['base', 'dark', 'light'] as const) {
      for (const [key, hex] of Object.entries(TOKENS_BY_THEME[theme])) {
        const value = resolveVariable(variablesByTheme[theme], `color-${kebab(key)}`);
        expect({ theme, key, value }).toEqual({ theme, key, value: hex });
      }
    }
  });

  it('every font size mirrors its theme variable', () => {
    for (const [key, px] of Object.entries(fontSizes)) {
      expect({ key, value: variables.get(`text-${key}`) }).toEqual({ key, value: `${px}px` });
    }
  });
});
