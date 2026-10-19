import { describe, expect, it } from 'vite-plus/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { tokens } from '../../src/lib/tokens.ts';

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

describe('tokens', () => {
  it('every colour token has a CSS theme variable', () => {
    const variables = themeVariables(
      readFileSync(resolve(import.meta.dirname, '../../src/theme.css'), 'utf8'),
    );
    for (const [key, hex] of Object.entries(tokens)) {
      expect({ key, value: resolveVariable(variables, `color-${kebab(key)}`) }).toEqual({
        key,
        value: hex,
      });
    }
  });
});
