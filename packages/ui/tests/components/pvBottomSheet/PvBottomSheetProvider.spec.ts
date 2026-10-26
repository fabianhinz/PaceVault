// @vitest-environment node
import { describe, expect, it } from 'vite-plus/test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import {
  PvBottomSheetProvider,
  useSheetPeekContext,
  useUnstableSheetPeekContext,
} from '../../../src/components/pvBottomSheet/PvBottomSheetProvider.tsx';

const ThrowingProbe = () => String(useSheetPeekContext().active);
const UnstableProbe = () => String(useUnstableSheetPeekContext() === undefined);

describe(PvBottomSheetProvider.name, () => {
  it('throws from useSheetPeekContext outside the provider', () => {
    expect(() => renderToString(createElement(ThrowingProbe))).toThrow(
      'useSheetPeekContext must be used inside PvBottomSheetProvider',
    );
  });

  it('reads undefined from useUnstableSheetPeekContext outside the provider', () => {
    expect(renderToString(createElement(UnstableProbe))).toBe('true');
  });

  it('reads the context from useUnstableSheetPeekContext inside the provider', () => {
    expect(
      renderToString(createElement(PvBottomSheetProvider, null, createElement(UnstableProbe))),
    ).toBe('false');
  });
});
