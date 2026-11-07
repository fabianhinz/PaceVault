import { describe, expect, it } from 'vite-plus/test';
import { horizontalScrollFadeEdges, scrollFadeEdges } from '../../src/lib/scrollFade.ts';

describe(scrollFadeEdges.name, () => {
  it('fades only the bottom at the top of a long list', () => {
    expect(scrollFadeEdges({ scrollTop: 0, scrollHeight: 1000, clientHeight: 300 })).toEqual({
      top: false,
      bottom: true,
    });
  });

  it('fades both edges in the middle', () => {
    expect(scrollFadeEdges({ scrollTop: 300, scrollHeight: 1000, clientHeight: 300 })).toEqual({
      top: true,
      bottom: true,
    });
  });

  it('fades only the top at the end', () => {
    expect(scrollFadeEdges({ scrollTop: 700, scrollHeight: 1000, clientHeight: 300 })).toEqual({
      top: true,
      bottom: false,
    });
  });

  it('fades nothing without overflow', () => {
    expect(scrollFadeEdges({ scrollTop: 0, scrollHeight: 300, clientHeight: 300 })).toEqual({
      top: false,
      bottom: false,
    });
  });

  it('fades nothing 1 px off the end of a list that barely overflows', () => {
    expect(scrollFadeEdges({ scrollTop: 0, scrollHeight: 301, clientHeight: 300 })).toEqual({
      top: false,
      bottom: false,
    });
  });
});

describe(horizontalScrollFadeEdges.name, () => {
  it('fades only the right at the start of a wide row', () => {
    expect(
      horizontalScrollFadeEdges({ scrollLeft: 0, scrollWidth: 1000, clientWidth: 300 }),
    ).toEqual({
      left: false,
      right: true,
    });
  });

  it('fades only the left when scrolled to the end', () => {
    expect(
      horizontalScrollFadeEdges({ scrollLeft: 700, scrollWidth: 1000, clientWidth: 300 }),
    ).toEqual({ left: true, right: false });
  });

  it('fades both edges in the middle', () => {
    expect(
      horizontalScrollFadeEdges({ scrollLeft: 300, scrollWidth: 1000, clientWidth: 300 }),
    ).toEqual({ left: true, right: true });
  });

  it('fades nothing without overflow', () => {
    expect(
      horizontalScrollFadeEdges({ scrollLeft: 0, scrollWidth: 300, clientWidth: 300 }),
    ).toEqual({
      left: false,
      right: false,
    });
  });
});
