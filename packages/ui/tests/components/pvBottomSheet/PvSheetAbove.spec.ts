// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { PvSheetAbove } from '../../../src/components/pvBottomSheet/PvSheetAbove.tsx';
import { PvBottomSheetProvider } from '../../../src/components/pvBottomSheet/PvBottomSheetProvider.tsx';

describe('PvSheetAbove', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('warns and renders nothing outside PvBottomSheetProvider', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(renderToString(createElement(PvSheetAbove, null, 'controls'))).toBe('');
    expect(warn).toHaveBeenCalledWith(
      'PvSheetAbove rendered outside PvBottomSheetProvider; nothing is shown.',
    );
  });

  it('stays silent inside PvBottomSheetProvider', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(
      renderToString(
        createElement(PvBottomSheetProvider, null, createElement(PvSheetAbove, null, 'controls')),
      ),
    ).toBe('');
    expect(warn).not.toHaveBeenCalled();
  });
});
