import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { BACKLOG_DIR, REPO_ROOT } from './paths.ts';
import { readTechPaths, type TechPaths } from './techFile.ts';

export const itemTechPaths = (
  command: 'deps' | 'interfaces',
): { item: string; paths: TechPaths } => {
  const args = parseArgs({ allowPositionals: true, options: {} });
  const item = args.positionals[0];
  if (item === undefined) {
    console.error(`usage: vp run workbench:${command} -- <item>`);
    process.exit(1);
  }
  const techFile = join(REPO_ROOT, BACKLOG_DIR, item, 'tech.md');
  if (!existsSync(techFile)) {
    console.error(`${BACKLOG_DIR}/${item}/tech.md: missing`);
    process.exit(1);
  }
  return { item, paths: readTechPaths(readFileSync(techFile, 'utf8')) };
};
