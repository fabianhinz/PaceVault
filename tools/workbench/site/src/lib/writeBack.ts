/**
 * Line edits for the board's write-back: pure functions over the text of a Markdown file.
 * Every edit names the place it may touch (the frontmatter or one `## ` section) and the
 * lines it expects there, exactly as the board rendered them; anything else in the file stays
 * byte-identical. A mismatch (the file changed since) is `missing` or `duplicate`, which the
 * action turns into a 409.
 */

export type Place =
  | { kind: 'file' }
  | { kind: 'frontmatter'; key: string }
  | { kind: 'section'; heading: string };

export type EditResult =
  | { ok: true; text: string; diff: string }
  | { ok: false; reason: 'missing' | 'duplicate' | 'unchanged' };

type Range = { start: number; end: number };

const splitLines = (text: string) => text.split('\n');

const frontmatterRange = (lines: string[]): Range | undefined => {
  if (lines[0] !== '---') return undefined;
  const end = lines.indexOf('---', 1);
  if (end === -1) return undefined;
  return { start: 1, end };
};

type Heading = { index: number; depth: number; text: string };

const firstBodyLine = (lines: string[]): number => {
  const front = frontmatterRange(lines);
  if (front) return front.end + 1;
  return 0;
};

const headings = (lines: string[]): Heading[] => {
  const headingList: Heading[] = [];
  let index = firstBodyLine(lines);
  let fence = false;
  for (; index < lines.length; index++) {
    if (/^(```|~~~)/.test(lines[index])) fence = !fence;
    if (fence) continue;
    const match = /^(#{1,6})\s+(.*)$/.exec(lines[index]);
    if (match) headingList.push({ index, depth: match[1].length, text: match[2].trim() });
  }
  return headingList;
};

const sectionRange = ({
  lines,
  heading,
}: {
  lines: string[];
  heading: string;
}): (Range & { head: number }) | undefined => {
  const all = headings(lines);
  const head = all.find((candidate) => candidate.depth === 2 && candidate.text === heading);
  if (!head) return undefined;
  const next = all.find((candidate) => candidate.index > head.index && candidate.depth <= 2);
  let end = lines.length;
  if (next) end = next.index;
  return { head: head.index, start: head.index + 1, end };
};

const placeRange = ({ lines, place }: { lines: string[]; place: Place }): Range | undefined => {
  if (place.kind === 'file') return { start: 0, end: lines.length };
  if (place.kind === 'frontmatter') return frontmatterRange(lines);
  return sectionRange({ lines, heading: place.heading });
};

export type Item = { raw: string; first: string; heading: string | undefined };

export const fileItems = (text: string): Item[] => {
  const lines = splitLines(text);
  const marks = new Map(headings(lines).map((heading) => [heading.index, heading]));
  let index = firstBodyLine(lines);
  const items: Item[] = [];
  let heading: string | undefined = undefined;
  let current: string[] | undefined = undefined;
  let currentHeading: string | undefined = undefined;
  const flush = () => {
    if (current)
      items.push({ raw: current.join('\n'), first: current[0], heading: currentHeading });
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
    } else if (!fence && line.startsWith('- ')) {
      flush();
      current = [line];
      currentHeading = heading;
    } else if (current && /^\s+\S/.test(line)) current.push(line);
    else if (current && line.trim() !== '') flush();
  }
  flush();
  return items;
};

const findBlock = ({
  lines,
  range,
  expected,
}: {
  lines: string[];
  range: Range;
  expected: string[];
}): number[] => {
  const hits: number[] = [];
  for (let index = range.start; index + expected.length <= range.end; index++) {
    if (expected.every((line, offset) => lines[index + offset] === line)) hits.push(index);
  }
  return hits;
};

const appliedEdit = ({ before, lines }: { before: string; lines: string[] }): EditResult => {
  const text = lines.join('\n');
  return { ok: true, text, diff: unifiedDiff({ before, after: text }) };
};

const findUniqueBlock = ({
  lines,
  place,
  expected,
}: {
  lines: string[];
  place: Place;
  expected: string;
}):
  | { ok: false; reason: 'missing' | 'duplicate' }
  | { ok: true; start: number; length: number } => {
  const range = placeRange({ lines, place });
  if (!range) return { ok: false, reason: 'missing' };
  const want = splitLines(expected);
  const hits = findBlock({ lines, range, expected: want });
  if (hits.length === 0) return { ok: false, reason: 'missing' };
  if (hits.length > 1) return { ok: false, reason: 'duplicate' };
  return { ok: true, start: hits[0], length: want.length };
};

export const editLine = ({
  text,
  place,
  expected,
  next,
}: {
  text: string;
  place: Place;
  expected: string;
  next: string;
}): EditResult => {
  if (next === expected) return { ok: false, reason: 'unchanged' };
  const lines = splitLines(text);
  const block = findUniqueBlock({ lines, place, expected });
  if (!block.ok) return block;
  lines.splice(block.start, block.length, ...splitLines(next));
  return appliedEdit({ before: text, lines });
};

export const deleteLine = ({
  text,
  place,
  expected,
}: {
  text: string;
  place: Place;
  expected: string;
}): EditResult => {
  const lines = splitLines(text);
  const block = findUniqueBlock({ lines, place, expected });
  if (!block.ok) return block;
  const at = block.start;
  lines.splice(at, block.length);
  if (at > 0 && lines[at - 1] === '' && lines[at] === '') lines.splice(at, 1);
  return appliedEdit({ before: text, lines });
};

export const insertLine = ({
  text,
  place,
  after,
  line,
}: {
  text: string;
  place: Place;
  after: string;
  line: string;
}): EditResult => {
  const lines = splitLines(text);
  const block = findUniqueBlock({ lines, place, expected: after });
  if (!block.ok) return block;
  lines.splice(block.start + block.length, 0, ...splitLines(line));
  return appliedEdit({ before: text, lines });
};

type DiffOp = { kind: ' ' | '-' | '+'; line: string; beforeIndex: number; afterIndex: number };

type DiffKind = { kind: DiffOp['kind']; line: string };

const lcsLengths = ({
  beforeMiddle,
  afterMiddle,
}: {
  beforeMiddle: string[];
  afterMiddle: string[];
}): Int32Array[] => {
  const lengths = Array.from(
    { length: beforeMiddle.length + 1 },
    () => new Int32Array(afterMiddle.length + 1),
  );
  for (let i = beforeMiddle.length - 1; i >= 0; i--) {
    for (let j = afterMiddle.length - 1; j >= 0; j--) {
      if (beforeMiddle[i] === afterMiddle[j]) lengths[i][j] = lengths[i + 1][j + 1] + 1;
      else lengths[i][j] = Math.max(lengths[i + 1][j], lengths[i][j + 1]);
    }
  }
  return lengths;
};

const editScript = ({
  beforeMiddle,
  afterMiddle,
  lcsLengths,
}: {
  beforeMiddle: string[];
  afterMiddle: string[];
  lcsLengths: Int32Array[];
}): DiffKind[] => {
  const kinds: DiffKind[] = [];
  let i = 0;
  let j = 0;
  while (i < beforeMiddle.length || j < afterMiddle.length) {
    if (i < beforeMiddle.length && j < afterMiddle.length && beforeMiddle[i] === afterMiddle[j]) {
      kinds.push({ kind: ' ', line: beforeMiddle[i] });
      i++;
      j++;
    } else if (
      i < beforeMiddle.length &&
      (j === afterMiddle.length || lcsLengths[i + 1][j] >= lcsLengths[i][j + 1])
    ) {
      kinds.push({ kind: '-', line: beforeMiddle[i] });
      i++;
    } else {
      kinds.push({ kind: '+', line: afterMiddle[j] });
      j++;
    }
  }
  return kinds;
};

const diffOps = ({ before, after }: { before: string[]; after: string[] }): DiffOp[] => {
  let prefix = 0;
  while (prefix < before.length && prefix < after.length && before[prefix] === after[prefix])
    prefix++;
  let suffix = 0;
  while (
    suffix < before.length - prefix &&
    suffix < after.length - prefix &&
    before[before.length - 1 - suffix] === after[after.length - 1 - suffix]
  ) {
    suffix++;
  }
  const beforeMiddle = before.slice(prefix, before.length - suffix);
  const afterMiddle = after.slice(prefix, after.length - suffix);
  const kinds: DiffKind[] = [
    ...before.slice(0, prefix).map((line): DiffKind => ({ kind: ' ', line })),
    ...editScript({
      beforeMiddle,
      afterMiddle,
      lcsLengths: lcsLengths({ beforeMiddle, afterMiddle }),
    }),
    ...before.slice(before.length - suffix).map((line): DiffKind => ({ kind: ' ', line })),
  ];
  let lineA = 0;
  let lineB = 0;
  return kinds.map((op) => {
    const numberedOp = { ...op, beforeIndex: lineA, afterIndex: lineB };
    if (op.kind !== '+') lineA++;
    if (op.kind !== '-') lineB++;
    return numberedOp;
  });
};

const diffLines = (text: string | null): string[] => {
  if (text === null || text === '') return [];
  const lines = splitLines(text);
  if (lines.at(-1) === '') lines.pop();
  return lines;
};

const DIFF_CONTEXT_LINES = 3;

export const unifiedDiff = ({
  before,
  after,
}: {
  before: string | null;
  after: string | null;
}): string => {
  const ops = diffOps({ before: diffLines(before), after: diffLines(after) });
  const changed = ops.flatMap((op, index) => {
    if (op.kind === ' ') return [];
    return [index];
  });
  const hunks: Range[] = [];
  for (const index of changed) {
    const last = hunks.at(-1);
    if (last && index - last.end <= 2 * DIFF_CONTEXT_LINES) last.end = index;
    else hunks.push({ start: index, end: index });
  }
  const hunkLines: string[] = [];
  for (const hunk of hunks) {
    const slice = ops.slice(
      Math.max(0, hunk.start - DIFF_CONTEXT_LINES),
      Math.min(ops.length, hunk.end + DIFF_CONTEXT_LINES + 1),
    );
    const oldCount = slice.filter((op) => op.kind !== '+').length;
    const newCount = slice.filter((op) => op.kind !== '-').length;
    let oldStart = slice[0].beforeIndex;
    if (oldCount > 0) oldStart++;
    let newStart = slice[0].afterIndex;
    if (newCount > 0) newStart++;
    hunkLines.push(`@@ -${oldStart},${oldCount} +${newStart},${newCount} @@`);
    for (const op of slice) hunkLines.push(`${op.kind}${op.line}`);
  }
  return hunkLines.join('\n');
};

const ownerQuote = (words: string): string =>
  words
    .replace(/\s+/g, ' ')
    .replace(/["“”]/g, "'")
    .trim();

export const tickLine = ({ first, checked }: { first: string; checked: boolean }): string => {
  let box = '[ ]';
  if (checked) box = '[x]';
  return first.replace(/^- \[( |x|X)\]/, `- ${box}`);
};

export type Option = { id: string; text: string };

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

export const questionParts = (
  first: string,
): { id: string; state: string; date: string | undefined; body: string } | undefined => {
  const match = QUESTION_LINE.exec(first);
  if (!match) return undefined;
  return { id: match[1], state: match[2], date: match[3], body: match[4] };
};

export const answerLine = ({
  first,
  date,
  option,
  words,
}: {
  first: string;
  date: string;
  option: string;
  words: string;
}): string | undefined => {
  const parts = questionParts(first);
  if (!parts) return undefined;
  const said = ownerQuote(words);
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

export const commentLine = ({ date, words }: { date: string; words: string }): string =>
  `  - Owner ${date}: "${ownerQuote(words)}"`;

const FINDING =
  /^- \*\*(R\d+)\*\*\s*·\s*(open|fixed|declined)\s*·\s*(?:on (\S+)|general)\s*·\s*(.*)$/;

export type Finding = { id: string; state: string; on: string | undefined; text: string };

export const findingParts = (first: string): Finding | undefined => {
  const match = FINDING.exec(first);
  if (!match) return undefined;
  return { id: match[1], state: match[2], on: match[3], text: match[4] };
};
