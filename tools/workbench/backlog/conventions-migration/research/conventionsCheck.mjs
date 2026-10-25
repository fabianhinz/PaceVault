// Usage (from the repo root): node tools/workbench/backlog/conventions-migration/research/conventionsCheck.mjs <conventionsDir> [--write]
// Prints the generated CLAUDE.md index (or writes it) and validates plans <-> TDRs.
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2];
const write = process.argv.includes('--write');

const frontmatter = (text) => {
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const fields = {};
  let listKey = null;
  for (const line of match[1].split('\n')) {
    const item = line.match(/^\s+-\s+(.*)$/);
    if (item && listKey) {
      fields[listKey].push(item[1].replace(/^["']|["']$/g, ''));
      continue;
    }
    const pair = line.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (!pair) continue;
    const [, key, raw] = pair;
    if (raw === '') {
      fields[key] = [];
      listKey = key;
    } else if (raw.startsWith('[')) {
      fields[key] = raw.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean);
      listKey = null;
    } else {
      fields[key] = raw.replace(/^["']|["']$/g, '');
      listKey = null;
    }
  }
  return fields;
};

const tdrDir = join(dir, 'tdr');
const planDir = join(dir, 'plans');
const tdrs = readdirSync(tdrDir).filter((f) => f.endsWith('.md'));
const errors = [];

const lines = [];
for (const file of tdrs) {
  const fm = frontmatter(readFileSync(join(tdrDir, file), 'utf8'));
  if (!fm) { errors.push(`tdr/${file}: no frontmatter`); continue; }
  if (fm.id !== file.replace(/\.md$/, '')) errors.push(`tdr/${file}: id ${fm.id} does not match file name`);
  if (!fm.governs || fm.governs.length === 0) errors.push(`tdr/${file}: empty governs`);
  for (const glob of fm.governs ?? []) lines.push({ glob, title: fm.title, file, summary: fm.summary });
}
lines.sort((a, b) => (a.glob < b.glob ? -1 : a.glob > b.glob ? 1 : a.title < b.title ? -1 : a.title > b.title ? 1 : 0));

const header = `# Adopted conventions

Binding on this project. Before changing a file, find the entries whose paths
match it and read those records in \`tdr/\`. The lines below are pointers, not
the rule — rule text, detection signals and reference implementation live in
the record.

Generated from \`tdr/*.md\`. Don't hand-edit this file; edit the record.

`;
const index = header + lines.map((l) => `- \`${l.glob}\` — [${l.title}](tdr/${l.file}): ${l.summary}`).join('\n') + '\n';

const plans = existsSync(planDir) ? readdirSync(planDir).filter((f) => f.endsWith('.md')) : [];
const planIds = new Set(plans.map((f) => f.replace(/\.md$/, '')));
const deps = new Map();
for (const file of plans) {
  const fm = frontmatter(readFileSync(join(planDir, file), 'utf8'));
  const id = file.replace(/\.md$/, '');
  if (!fm) { errors.push(`plans/${file}: no frontmatter`); continue; }
  if (fm.id !== id) errors.push(`plans/${file}: id ${fm.id} does not match file name`);
  if (fm.tdr_reference && !existsSync(join(dir, fm.tdr_reference))) errors.push(`plans/${file}: missing ${fm.tdr_reference}`);
  if (!fm.tdr_reference && id !== 'tooling') errors.push(`plans/${file}: no tdr_reference`);
  const list = Array.isArray(fm.depends_on) ? fm.depends_on : [];
  for (const dep of list) if (!planIds.has(dep)) errors.push(`plans/${file}: depends_on unknown plan ${dep}`);
  deps.set(id, list.filter((d) => planIds.has(d)));
}
const state = new Map();
const visit = (id, path) => {
  if (state.get(id) === 'done') return;
  if (state.get(id) === 'active') { errors.push(`cycle: ${[...path, id].join(' -> ')}`); return; }
  state.set(id, 'active');
  for (const dep of deps.get(id) ?? []) visit(dep, [...path, id]);
  state.set(id, 'done');
};
for (const id of deps.keys()) visit(id, []);

if (write) writeFileSync(join(dir, 'CLAUDE.md'), index);
else process.stdout.write(index);
process.stderr.write(`${tdrs.length} TDRs, ${plans.length} plans, ${errors.length} error(s)\n${errors.join('\n')}${errors.length ? '\n' : ''}`);
process.exitCode = errors.length ? 1 : 0;
