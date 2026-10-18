import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkWorkbench, featureFolders } from '../../workbench/site/src/check.ts';

describe('checkWorkbench', () => {
  let root = '';
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'wb-check-'));
  });
  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('does not report plan.md missing for an empty leftover folder, only for one with files', () => {
    mkdirSync(join(root, 'test-title'));
    mkdirSync(join(root, 'empty-tree', 'mockup'), { recursive: true });
    mkdirSync(join(root, 'notes-only'));
    writeFileSync(join(root, 'notes-only', 'notes.md'), 'x\n');

    expect(featureFolders(root)).toEqual(['notes-only']);
    expect(checkWorkbench(root)).toEqual(['workbench/notes-only/plan.md: missing']);
  });
});
