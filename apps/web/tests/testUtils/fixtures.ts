import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** Reads a FIT file from the Playwright fixtures (`apps/web/e2e/fixtures/`) into a fresh `ArrayBuffer`. */
export const readE2eFixture = (name: string): ArrayBuffer => {
  const buf = readFileSync(resolve(import.meta.dirname, '../../e2e/fixtures', name));
  const bytes = new Uint8Array(buf.byteLength);
  bytes.set(buf);
  return bytes.buffer;
};
