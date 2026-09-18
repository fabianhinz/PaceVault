import { describe, it, expect } from 'vitest';
import { looksLikeFitFile } from '@/lib/intervals/fitSniff.ts';

const withMagic = (magic: string, length = 32): ArrayBuffer => {
  const bytes = new Uint8Array(length);
  for (let i = 0; i < magic.length; i++) {
    bytes[8 + i] = magic.charCodeAt(i);
  }
  return bytes.buffer;
};

describe('looksLikeFitFile', () => {
  it('accepts a buffer carrying the .FIT magic at offset 8', () => {
    expect(looksLikeFitFile(withMagic('.FIT'))).toBe(true);
  });

  it('rejects XML payloads such as GPX or TCX', () => {
    const xml = new TextEncoder().encode('<?xml version="1.0" encoding="UTF-8"?><gpx>');
    expect(looksLikeFitFile(xml.buffer as ArrayBuffer)).toBe(false);
  });

  it('rejects a buffer too short to carry the magic', () => {
    expect(looksLikeFitFile(new Uint8Array(8).buffer)).toBe(false);
    expect(looksLikeFitFile(new ArrayBuffer(0))).toBe(false);
  });

  it('rejects a near miss', () => {
    expect(looksLikeFitFile(withMagic('.FIS'))).toBe(false);
  });
});
