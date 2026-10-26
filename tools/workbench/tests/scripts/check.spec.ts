import { describe, it, expect, beforeEach, afterEach } from 'vite-plus/test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkWorkbench, itemFolders } from '@scripts/check.ts';
import { checkDecisions } from '@scripts/checkRules.ts';

describe('check', () => {
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

    expect(itemFolders(root)).toEqual(['notes-only']);
    expect(checkWorkbench(root)).toEqual(['tools/workbench/backlog/notes-only/plan.md: missing']);
  });

  it('checks the format of review/decisions.md; a superseded item needs its pointer', () => {
    const path = 'tools/workbench/backlog/x/review/decisions.md';
    const FORMAT = '- [ ] **(<kind>) <decision>.** Agent: <reason>';
    const good =
      '## Agent decisions\n\n- [ ] **Batch 50.** Agent: fits.\n- [x] **Desktop at 1280** (shell). Agent: the frame,\n  over two lines.\n';
    expect(checkDecisions({ folder: 'x', text: good })).toEqual([]);
    expect(checkDecisions({ folder: 'x', text: '# Notes\n' })).toEqual([
      `${path}: no ## Agent decisions heading`,
    ]);
    expect(
      checkDecisions({
        folder: 'x',
        text: '## Agent decisions\n\nA note.\n\n- [ ] Batch 50, no bold lead. Agent: fits.\n- **Plain.** Agent: no box.\n- [ ] **No reason.**\n',
      }),
    ).toEqual([
      `${path}: only "${FORMAT}" items go under ## Agent decisions`,
      `${path}: "- [ ] Batch 50, no bold lead. Agent: fits." is not "${FORMAT}"`,
      `${path}: "- **Plain.** Agent: no box." is not "${FORMAT}"`,
      `${path}: "- [ ] **No reason.**" is not "${FORMAT}"`,
    ]);
    expect(
      checkDecisions({
        folder: 'x',
        text: '## Agent decisions\n\n- [~] **(look) Popover guide.** Agent: one surface. Superseded by: guide in the Panel.\n- [~] **Old.** Agent: x.\n',
      }),
    ).toEqual([
      `${path}: "- [~] **Old.** Agent: x." is superseded without "Superseded by: <pointer>"`,
    ]);

    mkdirSync(join(root, 'x', 'review'), { recursive: true });
    writeFileSync(
      join(root, 'x', 'plan.md'),
      '---\ntitle: X\nstatus: idea\ncreated: 2026-10-19\ntype: chore\nareas: [workbench]\nnext: N\n---\n\n# X\n',
    );
    writeFileSync(join(root, 'x', 'review', 'decisions.md'), '# Notes\n');
    expect(checkWorkbench(root)).toEqual([`${path}: no ## Agent decisions heading`]);
  });
});
