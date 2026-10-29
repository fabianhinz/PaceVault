// @vitest-environment node
import { describe, expect, it } from 'vite-plus/test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { useMediaQuery } from '../../src/hooks/useMediaQuery.ts';

const Probe = () => String(useMediaQuery('(min-width: 1024px)'));

describe(useMediaQuery.name, () => {
  it('reads as not matching when rendered on the server without window', () => {
    expect(typeof window).toBe('undefined');
    expect(renderToString(createElement(Probe))).toBe('false');
  });
});
