// @vitest-environment node
import { describe, expect, it, vi } from 'vite-plus/test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { PvSheetPeek } from '../../../src/components/pvBottomSheet/PvSheetPeek.tsx';
import { PvBottomSheetProvider } from '../../../src/components/pvBottomSheet/PvBottomSheetProvider.tsx';

describe(PvSheetPeek.name, () => {
  it('warns and renders nothing outside PvBottomSheetProvider', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(renderToString(createElement(PvSheetPeek, { icon: null, primary: 'Run' }))).toBe('');
    expect(warn).toHaveBeenCalledWith(
      'PvSheetPeek rendered outside PvBottomSheetProvider; nothing is shown.',
    );
  });

  it('stays silent inside PvBottomSheetProvider', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(
      renderToString(
        createElement(
          PvBottomSheetProvider,
          null,
          createElement(PvSheetPeek, { icon: null, primary: 'Run' }),
        ),
      ),
    ).toBe('');
    expect(warn).not.toHaveBeenCalled();
  });
});
