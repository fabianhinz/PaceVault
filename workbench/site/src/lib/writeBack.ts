/**
 * Line edits for the board's write-back: pure functions over the text of a Markdown file.
 * Every edit names the place it may touch (the frontmatter or one `## ` section) and the
 * lines it expects there, exactly as the board rendered them; anything else in the file stays
 * byte-identical. A mismatch (the file changed since) is `missing` or `duplicate`, which the
 * action turns into a 409.
 */

export type Place =
  /** The whole file (lists without a `## ` heading, e.g. flaky.md). */
  { kind: 'file' } | { kind: 'frontmatter'; key: string } | { kind: 'section'; heading: string };

export type EditResult =
  | { ok: true; text: string; diff: string }
  | { ok: false; reason: 'missing' | 'duplicate' | 'unchanged' };

type Range = { start: number; end: number };

const split = (text: string) => text.split('\n');

/** The frontmatter lines between the two `---` (exclusive), when the file starts with one. */
const frontmatterRange = (lines: string[]): Range | undefined => {
  if (lines[0] !== '---') return undefined;
  const end = lines.indexOf('---', 1);
  if (end === -1) return undefined;
  return { start: 1, end };
};

type Heading = { index: number; depth: number; text: string };

/** Markdown headings after the frontmatter, skipping fenced code blocks. */
const headings = (lines: string[]): Heading[] => {
  const out: Heading[] = [];
  let index = 0;
  const front = frontmatterRange(lines);
  if (front) index = front.end + 1;
  let fence = false;
  for (; index < lines.length; index++) {
    if (/^(```|~~~)/.test(lines[index])) fence = !fence;
    if (fence) continue;
    const match = /^(#{1,6})\s+(.*)$/.exec(lines[index]);
    if (match) out.push({ index, depth: match[1].length, text: match[2].trim() });
  }
  return out;
};

/** The body lines of `## heading`: from the line after it up to the next heading of depth ≤ 2. */
const sectionRange = (lines: string[], heading: string): (Range & { head: number }) | undefined => {
  const all = headings(lines);
  const head = all.find((candidate) => candidate.depth === 2 && candidate.text === heading);
  if (!head) return undefined;
  const next = all.find((candidate) => candidate.index > head.index && candidate.depth <= 2);
  let end = lines.length;
  if (next) end = next.index;
  return { head: head.index, start: head.index + 1, end };
};

const placeRange = (lines: string[], place: Place): Range | undefined => {
  if (place.kind === 'file') return { start: 0, end: lines.length };
  if (place.kind === 'frontmatter') return frontmatterRange(lines);
  return sectionRange(lines, place.heading);
};

/**
 * A list item: its first line `- …` plus indented continuation lines (sub-bullets), and the
 * `## ` heading it sits under (`undefined` above the first one).
 */
export type Item = { raw: string; first: string; heading: string | undefined };

/** Every top-level list item of a file (outside the frontmatter and code fences). */
export const fileItems = (text: string): Item[] => {
  const lines = split(text);
  const marks = new Map(headings(lines).map((heading) => [heading.index, heading]));
  const front = frontmatterRange(lines);
  let index = 0;
  if (front) index = front.end + 1;
  const out: Item[] = [];
  let heading: string | undefined = undefined;
  let current: string[] | undefined = undefined;
  let currentHeading: string | undefined = undefined;
  const flush = () => {
    if (current) out.push({ raw: current.join('\n'), first: current[0], heading: currentHeading });
    current = undefined;
  };
  let fence = false;
  for (; index < lines.length; index++) {
    const line = lines[index];
    if (/^(```|~~~)/.test(line)) fence = !fence;
    const mark = marks.get(index);
    if (mark) {
      flush();
      if (mark.depth <= 2) heading = mark.text;
    } else if (!fence && /^- /.test(line)) {
      flush();
      current = [line];
      currentHeading = heading;
    } else if (current && /^\s+\S/.test(line)) current.push(line);
    else if (current && line.trim() !== '') flush();
  }
  flush();
  return out;
};

/** Start indices of the blocks of lines equal to `expected` inside `range`. */
const findBlock = (lines: string[], range: Range, expected: string[]): number[] => {
  const hits: number[] = [];
  for (let index = range.start; index + expected.length <= range.end; index++) {
    if (expected.every((line, offset) => lines[index + offset] === line)) hits.push(index);
  }
  return hits;
};

const done = (before: string, lines: string[]): EditResult => {
  const text = lines.join('\n');
  return { ok: true, text, diff: unifiedDiff(before, text) };
};

/** Replaces the one block of lines equal to `expected` in `place` with `next`. */
export const editLine = (
  text: string,
  place: Place,
  expected: string,
  next: string,
): EditResult => {
  if (next === expected) return { ok: false, reason: 'unchanged' };
  const lines = split(text);
  const range = placeRange(lines, place);
  if (!range) return { ok: false, reason: 'missing' };
  const want = split(expected);
  const hits = findBlock(lines, range, want);
  if (hits.length === 0) return { ok: false, reason: 'missing' };
  if (hits.length > 1) return { ok: false, reason: 'duplicate' };
  lines.splice(hits[0], want.length, ...split(next));
  return done(text, lines);
};

/** Removes the one block equal to `expected`; a blank line left doubled is dropped once. */
export const deleteLine = (text: string, place: Place, expected: string): EditResult => {
  const lines = split(text);
  const range = placeRange(lines, place);
  if (!range) return { ok: false, reason: 'missing' };
  const want = split(expected);
  const hits = findBlock(lines, range, want);
  if (hits.length === 0) return { ok: false, reason: 'missing' };
  if (hits.length > 1) return { ok: false, reason: 'duplicate' };
  const at = hits[0];
  lines.splice(at, want.length);
  if (at > 0 && lines[at - 1] === '' && lines[at] === '') lines.splice(at, 1);
  return done(text, lines);
};

/** Inserts `line` (one or more lines) into `place`, right after the one block equal to `after`. */
export const insertLine = (text: string, place: Place, after: string, line: string): EditResult => {
  const lines = split(text);
  const range = placeRange(lines, place);
  if (!range) return { ok: false, reason: 'missing' };
  const want = split(after);
  const hits = findBlock(lines, range, want);
  if (hits.length === 0) return { ok: false, reason: 'missing' };
  if (hits.length > 1) return { ok: false, reason: 'duplicate' };
  lines.splice(hits[0] + want.length, 0, ...split(line));
  return done(text, lines);
};

type DiffOp = { kind: ' ' | '-' | '+'; line: string; a: number; b: number };

/** Line diff (common prefix and suffix, LCS in between). */
const diffOps = (a: string[], b: string[]): DiffOp[] => {
  let prefix = 0;
  while (prefix < a.length && prefix < b.length && a[prefix] === b[prefix]) prefix++;
  let suffix = 0;
  while (
    suffix < a.length - prefix &&
    suffix < b.length - prefix &&
    a[a.length - 1 - suffix] === b[b.length - 1 - suffix]
  ) {
    suffix++;
  }
  const midA = a.slice(prefix, a.length - suffix);
  const midB = b.slice(prefix, b.length - suffix);
  const table = Array.from({ length: midA.length + 1 }, () => new Int32Array(midB.length + 1));
  for (let i = midA.length - 1; i >= 0; i--) {
    for (let j = midB.length - 1; j >= 0; j--) {
      if (midA[i] === midB[j]) table[i][j] = table[i + 1][j + 1] + 1;
      else table[i][j] = Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  const kinds: { kind: DiffOp['kind']; line: string }[] = a
    .slice(0, prefix)
    .map((line) => ({ kind: ' ', line }));
  let i = 0;
  let j = 0;
  while (i < midA.length || j < midB.length) {
    if (i < midA.length && j < midB.length && midA[i] === midB[j]) {
      kinds.push({ kind: ' ', line: midA[i] });
      i++;
      j++;
    } else if (i < midA.length && (j === midB.length || table[i + 1][j] >= table[i][j + 1])) {
      kinds.push({ kind: '-', line: midA[i] });
      i++;
    } else {
      kinds.push({ kind: '+', line: midB[j] });
      j++;
    }
  }
  for (const line of a.slice(a.length - suffix)) kinds.push({ kind: ' ', line });
  let lineA = 0;
  let lineB = 0;
  return kinds.map((op) => {
    const out = { ...op, a: lineA, b: lineB };
    if (op.kind !== '+') lineA++;
    if (op.kind !== '-') lineB++;
    return out;
  });
};

/** Lines as `diff -u` sees them: a final newline ends the last line. */
const diffLines = (text: string | null): string[] => {
  if (text === null || text === '') return [];
  const lines = split(text);
  if (lines.at(-1) === '') lines.pop();
  return lines;
};

/**
 * The hunks of a unified diff (3 lines of context, no `---`/`+++` header); `null` is a file
 * that does not exist (created or deleted).
 */
export const unifiedDiff = (before: string | null, after: string | null): string => {
  const ops = diffOps(diffLines(before), diffLines(after));
  const changed = ops.flatMap((op, index) => {
    if (op.kind === ' ') return [];
    return [index];
  });
  const hunks: Range[] = [];
  for (const index of changed) {
    const last = hunks.at(-1);
    if (last && index - last.end <= 6) last.end = index;
    else hunks.push({ start: index, end: index });
  }
  const out: string[] = [];
  for (const hunk of hunks) {
    const slice = ops.slice(Math.max(0, hunk.start - 3), Math.min(ops.length, hunk.end + 4));
    const oldCount = slice.filter((op) => op.kind !== '+').length;
    const newCount = slice.filter((op) => op.kind !== '-').length;
    let oldStart = slice[0].a;
    if (oldCount > 0) oldStart++;
    let newStart = slice[0].b;
    if (newCount > 0) newStart++;
    out.push(`@@ -${oldStart},${oldCount} +${newStart},${newCount} @@`);
    for (const op of slice) out.push(`${op.kind}${op.line}`);
  }
  return out.join('\n');
};

// ---------- line builders: the exact text each board action writes ----------

/** The owner's words for `Owner: "…"`: one line, double quotes become single quotes. */
export const quote = (words: string): string =>
  words
    .replace(/\s+/g, ' ')
    .replace(/["“”]/g, "'")
    .trim();

/** `- [ ] …` ↔ `- [x] …` on the first line of a check item. */
export const tickLine = (first: string, checked: boolean): string => {
  let box = '[ ]';
  if (checked) box = '[x]';
  return first.replace(/^- \[( |x|X)\]/, `- ${box}`);
};

export type Option = { id: string; text: string };

/** A question line's text split into the question and its `(a) … (b) …` options (two or more). */
export const parseOptions = (body: string): { question: string; options: Option[] } => {
  const marks = [...body.matchAll(/(?:^|\s)(?:·\s)?\(([a-e])\)\s/g)];
  if (marks.length < 2) return { question: body, options: [] };
  const question = body
    .slice(0, marks[0].index)
    .replace(/\s*·\s*$/, '')
    .trim();
  const options = marks.map((mark, index) => {
    let end = body.length;
    const next = marks[index + 1];
    if (next) end = next.index;
    const text = body
      .slice(mark.index + mark[0].length, end)
      .replace(/\s*·\s*$/, '')
      .trim();
    return { id: mark[1], text };
  });
  return { question, options };
};

const QUESTION_LINE =
  /^- \*\*(Q\d+)\*\*\s*·\s*(open|answered)(?:\s+(\d{4}-\d{2}-\d{2}))?\s*·\s*(.*)$/;

/** The parts of a question's first line. */
export const questionParts = (
  first: string,
): { id: string; state: string; date: string | undefined; body: string } | undefined => {
  const match = QUESTION_LINE.exec(first);
  if (!match) return undefined;
  return { id: match[1], state: match[2], date: match[3], body: match[4] };
};

/**
 * The answered first line: options dropped, `→ (x) <option>. Owner: "<words>"`; empty words
 * quote the letter. Without options the words are the answer. `undefined`: nothing to write.
 */
export const answerLine = (
  first: string,
  date: string,
  option: string,
  words: string,
): string | undefined => {
  const parts = questionParts(first);
  if (!parts) return undefined;
  const said = quote(words);
  const parsed = parseOptions(parts.body);
  const chosen = parsed.options.find((candidate) => candidate.id === option);
  if (chosen) {
    let owner = said;
    if (owner === '') owner = chosen.id;
    const text = chosen.text.replace(/\.$/, '');
    return `- **${parts.id}** · answered ${date} · ${parsed.question} → (${chosen.id}) ${text}. Owner: "${owner}"`;
  }
  if (said === '') return undefined;
  return `- **${parts.id}** · answered ${date} · ${parts.body} → Owner: "${said}"`;
};

/** A comment under a question that stays open. */
export const commentLine = (date: string, words: string): string =>
  `  - Owner ${date}: "${quote(words)}"`;

const FINDING =
  /^- \*\*(R\d+)\*\*\s*·\s*(open|fixed|declined)\s*·\s*(?:on (\S+)|general)\s*·\s*(.*)$/;

export type Finding = { id: string; state: string; on: string | undefined; text: string };

export const findingParts = (first: string): Finding | undefined => {
  const match = FINDING.exec(first);
  if (!match) return undefined;
  return { id: match[1], state: match[2], on: match[3], text: match[4] };
};
