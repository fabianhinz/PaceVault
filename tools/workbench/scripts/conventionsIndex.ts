import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { parseFrontmatter } from './frontmatter.ts';
import { REPO_ROOT, comparePaths } from './paths.ts';

const CONVENTIONS_DIR = join(REPO_ROOT, 'docs/conventions');
const INDEX_FILE = join(CONVENTIONS_DIR, 'CLAUDE.md');
const TDR_DIR = join(CONVENTIONS_DIR, 'tdr');

const INDEX_HEADER = `# Adopted conventions

Binding on this project. Before changing a file, find the entries whose paths
match it and read those records in \`tdr/\`. The lines below are pointers, not
the rule — rule text, detection signals and reference implementation live in
the record.

Generated from \`tdr/*.md\` by \`vp run conventions:index\`. Don't hand-edit this file; edit the record.

`;

const tdrFrontmatterSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1),
  summary: z.string().trim().min(1),
  governs: z.array(z.string().min(1)).min(1),
});

export interface TdrRecord {
  file: string;
  text: string;
}

export interface ConventionsIndex {
  index: string;
  errors: string[];
}

interface IndexLine {
  glob: string;
  title: string;
  file: string;
  summary: string;
}

const indexLinesOf = ({ record, errors }: { record: TdrRecord; errors: string[] }): IndexLine[] => {
  const parsed = tdrFrontmatterSchema.safeParse(parseFrontmatter(record.text));
  if (!parsed.success) {
    errors.push(
      `tdr/${record.file}: ${parsed.error.issues.map((issue) => `${issue.path.join('.')} ${issue.message}`).join('; ')}`,
    );
    return [];
  }
  const id = record.file.replace(/\.md$/, '');
  if (parsed.data.id !== id)
    errors.push(`tdr/${record.file}: id ${parsed.data.id} does not match the file name`);
  return parsed.data.governs.map((glob) => ({
    glob,
    title: parsed.data.title,
    file: record.file,
    summary: parsed.data.summary,
  }));
};

const compareIndexLines = (a: IndexLine, b: IndexLine) =>
  comparePaths(a.glob, b.glob) || comparePaths(a.title, b.title);

export const conventionsIndex = (records: TdrRecord[]): ConventionsIndex => {
  const errors: string[] = [];
  const lines = records
    .flatMap((record) => indexLinesOf({ record, errors }))
    .sort(compareIndexLines);
  const entries = lines.map(
    (line) => `- \`${line.glob}\` — [${line.title}](tdr/${line.file}): ${line.summary}`,
  );
  return { index: `${INDEX_HEADER}${entries.join('\n')}\n`, errors };
};

const tdrRecords = (): TdrRecord[] =>
  readdirSync(TDR_DIR)
    .filter((file) => file.endsWith('.md'))
    .map((file) => ({ file, text: readFileSync(join(TDR_DIR, file), 'utf8') }));

const main = () => {
  const records = tdrRecords();
  const built = conventionsIndex(records);
  if (built.errors.length > 0) {
    console.error(built.errors.join('\n'));
    console.error(`Conventions: ${built.errors.length} TDR error(s)`);
    process.exit(1);
  }
  if (process.argv.includes('--write')) {
    writeFileSync(INDEX_FILE, built.index);
    console.log(`Conventions: wrote docs/conventions/CLAUDE.md from ${records.length} TDRs`);
    return;
  }
  if (readFileSync(INDEX_FILE, 'utf8') !== built.index) {
    console.error(
      'Conventions: docs/conventions/CLAUDE.md is out of date; run vp run conventions:index',
    );
    process.exit(1);
  }
  console.log(`Conventions: index matches ${records.length} TDRs`);
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
