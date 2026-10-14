import { describe, expect, it } from 'vitest';
import { scrollFadeEdges } from '@/lib/scrollFade.ts';

describe('scrollFadeEdges', () => {
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
