import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import ts from 'typescript';
import { compareFiles, gitChanges, type FileChange, type FilesComparison } from './changedFiles.ts';
import { readTechPaths } from './frontmatter.ts';

/**
 * The actual interfaces of an item at review time (`vp run workbench:deps -- <item>`, or alone
 * `vp run workbench:interfaces -- <item>`). Takes the TypeScript files git says changed since the
 * base (R23: the change list of `files.json`, planned and not planned against the `### New` and
 * `### Changed` paths of `tools/workbench/backlog/<item>/tech.md`, deleted files left out) and
 * lists every export with its type as the TypeScript checker prints it (values as
 * `export const name: <type>`, components with their props spelled out, types and interfaces as
 * declared). Writes `…/backlog/<item>/review/interfaces.md`, one ```ts block per file (unplanned
 * ones marked), the shape of tech.md's `## Interfaces` (the planned record), and the planned
 * TypeScript paths nobody changed under `## Missing`. Exit 1 only on a script or git error.
 */

const TS_FILE = /\.tsx?$/;

/** Planned paths in tech.md order: the TypeScript files that exist and the paths that do not. */
export type InterfaceFiles = { files: string[]; missing: string[] };

/** A changed TypeScript file and whether a planned path covers it. */
export type ChangedInterfaceFile = { path: string; planned: boolean };

/** The files `interfaces.md` lists (R23): the changed TypeScript files and the planned ones nobody changed. */
export type ChangedInterfaceFiles = { files: ChangedInterfaceFile[]; missing: string[] };

const isTypeScript = (path: string) => TS_FILE.test(path) && !path.endsWith('.d.ts');

/**
 * The TypeScript files of the git change list (`files.json`'s comparison, R23): changed and
 * planned first, then changed and not planned, each in path order, deleted files left out; the
 * planned TypeScript paths (files or folders) no change touched are missing.
 */
export const changedInterfaceFiles = (comparison: FilesComparison): ChangedInterfaceFiles => {
  const pick = (changes: FileChange[], planned: boolean) =>
    changes
      .filter((change) => change.status !== 'deleted' && isTypeScript(change.path))
      .map((change) => ({ path: change.path, planned }));
  return {
    files: [...pick(comparison.planned, true), ...pick(comparison.notPlanned, false)],
    missing: comparison.untouched.filter((path) => isTypeScript(path) || path.endsWith('/')),
  };
};

const walk = (root: string, dir: string): string[] =>
  readdirSync(join(root, dir), { withFileTypes: true })
    .filter((entry) => entry.name !== 'node_modules')
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return walk(root, path);
      if (TS_FILE.test(entry.name) && !entry.name.endsWith('.d.ts')) return [path];
      return [];
    });

/**
 * The TypeScript files behind the planned paths (repo-relative, in the given order, each once):
 * a `.ts`/`.tsx` path as is, a folder as its TypeScript files; other files are skipped and a path
 * that does not exist is missing.
 */
export const interfaceFiles = (root: string, paths: string[]): InterfaceFiles => {
  const files: string[] = [];
  const missing: string[] = [];
  for (const raw of paths) {
    const path = raw.replace(/\/+$/, '');
    const absolute = join(root, path);
    if (!existsSync(absolute)) {
      if (TS_FILE.test(path) || raw.endsWith('/')) missing.push(raw);
      continue;
    }
    let found: string[] = [];
    if (statSync(absolute).isDirectory()) found = walk(root, path);
    else if (TS_FILE.test(path)) found = [path];
    for (const file of found) {
      if (!files.includes(file)) files.push(file);
    }
  }
  return { files, missing };
};

/** Options for files no tsconfig.json covers (the test fixtures). */
const DEFAULT_OPTIONS: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2023,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.ReactJSX,
  allowImportingTsExtensions: true,
  strict: true,
  noEmit: true,
  skipLibCheck: true,
};

/** The nearest tsconfig.json above `file`, not above `root`; `undefined` when there is none. */
const nearestConfig = (root: string, file: string): string | undefined => {
  let dir = dirname(join(root, file));
  const top = resolve(root);
  while (dir.startsWith(top)) {
    const candidate = join(dir, 'tsconfig.json');
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
  return undefined;
};

type Project = { options: ts.CompilerOptions; rootNames: string[] };

/** Compiler options and root files of a tsconfig.json (its own files, so ambient types load). */
const readProject = (config: string | undefined): Project => {
  if (config === undefined) return { options: DEFAULT_OPTIONS, rootNames: [] };
  const read = ts.readConfigFile(config, (path) => ts.sys.readFile(path));
  if (read.error !== undefined) return { options: DEFAULT_OPTIONS, rootNames: [] };
  const parsed = ts.parseJsonConfigFileContent(read.config, ts.sys, dirname(config));
  return {
    options: { ...parsed.options, noEmit: true },
    rootNames: parsed.fileNames.filter((name) => name.endsWith('.d.ts')),
  };
};

const BUILDER_FLAGS =
  ts.NodeBuilderFlags.NoTruncation |
  ts.NodeBuilderFlags.IgnoreErrors |
  ts.NodeBuilderFlags.UseAliasDefinedOutsideCurrentScope |
  ts.NodeBuilderFlags.GenerateNamesForShadowedTypeParams;

const printer = ts.createPrinter({ removeComments: true });

/** The printer indents by four spaces; tech.md blocks use two. */
const reindent = (text: string): string =>
  text
    .split('\n')
    .map((line) => {
      const match = /^( +)/.exec(line);
      if (match === null) return line;
      return ' '.repeat(match[1].length / 2) + line.slice(match[1].length);
    })
    .join('\n');

/** `import("/abs/repo/x").Name` → `import("x").Name`: no machine paths in the output. */
const relativeImports = (text: string, root: string): string =>
  text.replaceAll(/import\("([^"]+)"\)/g, (whole, path: string) => {
    if (!path.startsWith('/')) return whole;
    return `import("${relative(root, path)}")`;
  });

/** Longer one-line types break their outermost object literals over lines, as Oxfmt would. */
const LINE = 100;

const multiline = (node: ts.Node): void => {
  if (ts.isTypeLiteralNode(node)) {
    ts.setEmitFlags(node, ts.EmitFlags.None);
    return;
  }
  ts.forEachChild(node, multiline);
};

const printNode = (node: ts.Node, file: ts.SourceFile): string => {
  const line = printer.printNode(ts.EmitHint.Unspecified, node, file);
  if (line.length <= LINE) return line;
  multiline(node);
  return reindent(printer.printNode(ts.EmitHint.Unspecified, node, file));
};

type Printing = { checker: ts.TypeChecker; file: ts.SourceFile };

/** A local interface or type alias of the file, by name. */
const localDeclaration = (
  file: ts.SourceFile,
  name: string,
): ts.InterfaceDeclaration | ts.TypeAliasDeclaration | undefined =>
  file.statements.find(
    (statement): statement is ts.InterfaceDeclaration | ts.TypeAliasDeclaration =>
      (ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement)) &&
      statement.name.text === name,
  );

/**
 * A component's props as written in its file: an inline object type, or the body of the local
 * interface or type alias it names (`Base & { … }` for `interface P extends Base`); `undefined`
 * when the props come from elsewhere (the checker prints them then).
 */
const propsText = (context: Printing, parameter: ts.Symbol): string | undefined => {
  const declaration = parameter.valueDeclaration;
  if (declaration === undefined || declaration.getSourceFile() !== context.file) return undefined;
  if (!ts.isParameter(declaration) || declaration.type === undefined) return undefined;
  const typeNode = declaration.type;
  if (ts.isTypeLiteralNode(typeNode)) return typeNode.getText(context.file);
  if (!ts.isTypeReferenceNode(typeNode) || !ts.isIdentifier(typeNode.typeName)) return undefined;
  if (typeNode.typeArguments !== undefined) return undefined;
  const local = localDeclaration(context.file, typeNode.typeName.text);
  if (local === undefined) return undefined;
  if (ts.isTypeAliasDeclaration(local)) return local.type.getText(context.file);
  const body = context.file.text.slice(local.members.pos - 1, local.end);
  const bases = (local.heritageClauses ?? []).flatMap((clause) =>
    clause.types.map((base) => base.getText(context.file)),
  );
  return [...bases, body].join(' & ');
};

/** A type as a printed type node; a component's props (one call signature, one parameter in a .tsx file) as written in its file. */
const printType = (context: Printing, type: ts.Type, at: ts.Node, component: boolean): string => {
  const checker = context.checker;
  const signatures = type.getCallSignatures();
  if (signatures.length === 1 && type.getProperties().length === 0) {
    const signature = signatures[0];
    const parameters = signature.getParameters();
    if (component && parameters.length === 1) {
      const props = propsText(context, parameters[0]);
      const returns = checker.typeToTypeNode(signature.getReturnType(), at, BUILDER_FLAGS);
      if (props !== undefined && returns !== undefined) {
        const name = parameters[0].getName();
        return `(${name}: ${props}) => ${printNode(returns, context.file)}`;
      }
    }
    const declaration = checker.signatureToSignatureDeclaration(
      signature,
      ts.SyntaxKind.FunctionType,
      at,
      BUILDER_FLAGS,
    );
    if (declaration !== undefined) return printNode(declaration, context.file);
  }
  const node = checker.typeToTypeNode(type, at, BUILDER_FLAGS);
  if (node === undefined) return checker.typeToString(type, at, ts.TypeFormatFlags.NoTruncation);
  return printNode(node, context.file);
};

const isExported = (node: ts.Node): boolean => {
  if (!ts.canHaveModifiers(node)) return false;
  const modifiers = ts.getModifiers(node) ?? [];
  return modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
};

const isComponentName = (context: Printing, name: string): boolean =>
  context.file.fileName.endsWith('.tsx') && /^[A-Z]/.test(name);

/** `export const name: <type>;` for a value symbol declared at `at`. */
const valueLine = (context: Printing, keyword: string, name: string, at: ts.Node): string => {
  const symbol = context.checker.getSymbolAtLocation(at);
  if (symbol === undefined) return `export ${keyword} ${name}: unknown;`;
  const type = context.checker.getTypeOfSymbolAtLocation(symbol, at);
  const printed = printType(context, type, at, isComponentName(context, name));
  return `export ${keyword} ${name}: ${printed};`;
};

/** The printed exports of one statement, in source order. */
const statementExports = (context: Printing, statement: ts.Statement): string[] => {
  if (ts.isExportDeclaration(statement)) return [statement.getText(context.file)];
  if (ts.isExportAssignment(statement)) {
    const type = context.checker.getTypeAtLocation(statement.expression);
    return [`export default ${printType(context, type, statement.expression, false)};`];
  }
  if (!isExported(statement)) return [];
  if (ts.isVariableStatement(statement)) {
    let keyword = 'const';
    if ((statement.declarationList.flags & ts.NodeFlags.Let) !== 0) keyword = 'let';
    return statement.declarationList.declarations.map((declaration) =>
      valueLine(context, keyword, declaration.name.getText(context.file), declaration.name),
    );
  }
  if (ts.isFunctionDeclaration(statement) && statement.name !== undefined) {
    return [valueLine(context, 'const', statement.name.text, statement.name)];
  }
  if (
    ts.isInterfaceDeclaration(statement) ||
    ts.isTypeAliasDeclaration(statement) ||
    ts.isEnumDeclaration(statement) ||
    ts.isClassDeclaration(statement)
  ) {
    return [statement.getText(context.file)];
  }
  return [];
};

/** The printed exports of each file, keyed by the repo-relative path. */
export const extractInterfaces = (root: string, files: string[]): Map<string, string[]> => {
  const groups = new Map<string | undefined, string[]>();
  for (const file of files) {
    const config = nearestConfig(root, file);
    groups.set(config, [...(groups.get(config) ?? []), file]);
  }
  const out = new Map<string, string[]>();
  for (const [config, group] of groups) {
    const project = readProject(config);
    const absolute = group.map((file) => resolve(root, file));
    const program = ts.createProgram({
      rootNames: [...project.rootNames, ...absolute],
      options: project.options,
    });
    const checker = program.getTypeChecker();
    for (const file of group) {
      const source = program.getSourceFile(resolve(root, file));
      if (source === undefined) {
        out.set(file, []);
        continue;
      }
      const context = { checker, file: source };
      const lines = source.statements.flatMap((statement) => statementExports(context, statement));
      out.set(
        file,
        lines.map((line) => relativeImports(line, resolve(root))),
      );
    }
  }
  return out;
};

/**
 * `review/interfaces.md`: a header line (date, command, counts), one ```ts block per changed file
 * headed by its path (`· not planned` when no planned path covers it), `// no exports` for a file
 * without any, then the planned paths nobody changed.
 */
export const renderInterfaces = (
  item: string,
  generated: string,
  found: ChangedInterfaceFiles,
  exports: Map<string, string[]>,
): string => {
  const unplanned = found.files.filter((file) => !file.planned).length;
  const parts = [
    `# Interfaces · ${item}\n`,
    `Generated ${generated} by \`vp run workbench:deps -- ${item}\` from the TypeScript files changed since the base (as \`files.json\`): ${found.files.length - unplanned} planned, ${unplanned} not planned. The checker's types; compare with tech.md \`## Interfaces\`, the planned record.\n`,
  ];
  for (const file of found.files) {
    const lines = exports.get(file.path) ?? [];
    let body = '// no exports';
    if (lines.length > 0) body = lines.join('\n');
    let head = file.path;
    if (!file.planned) head = `${file.path} · not planned`;
    parts.push(`\`\`\`ts\n// ${head}\n${body}\n\`\`\`\n`);
  }
  if (found.missing.length > 0) {
    parts.push('## Missing\n');
    parts.push(
      `${found.missing.map((path) => `- \`${path}\`: planned, not changed`).join('\n')}\n`,
    );
  }
  return parts.join('\n');
};

const REPO_ROOT = resolve(import.meta.dirname, '../../..');

/** The backlog folder, relative to the repo root. */
const BACKLOG = 'tools/workbench/backlog';

/**
 * Writes `review/interfaces.md` from the item's git change list (R23; also run by
 * `vp run workbench:deps`); returns the summary line.
 */
export const writeInterfaces = (item: string, comparison: FilesComparison): string => {
  const found = changedInterfaceFiles(comparison);
  const exports = extractInterfaces(
    REPO_ROOT,
    found.files.map((file) => file.path),
  );
  const generated = new Date().toISOString().slice(0, 10);
  const review = join(REPO_ROOT, BACKLOG, item, 'review');
  mkdirSync(review, { recursive: true });
  writeFileSync(join(review, 'interfaces.md'), renderInterfaces(item, generated, found, exports));
  const countOf = (planned: boolean) =>
    found.files
      .filter((file) => file.planned === planned)
      .reduce((sum, file) => sum + (exports.get(file.path) ?? []).length, 0);
  const unplanned = found.files.filter((file) => !file.planned).length;
  return `${BACKLOG}/${item}/review/interfaces.md: ${found.files.length - unplanned} planned files · ${countOf(true)} exports, ${unplanned} not planned files · ${countOf(false)} exports, ${found.missing.length} missing`;
};

/** `vp run workbench:interfaces -- <item>`: interfaces.md alone, without the import graphs. */
const main = () => {
  const args = parseArgs({ allowPositionals: true, options: {} });
  const item = args.positionals[0];
  if (item === undefined) {
    console.error('usage: vp run workbench:interfaces -- <item>');
    process.exit(1);
  }
  const techFile = join(REPO_ROOT, BACKLOG, item, 'tech.md');
  if (!existsSync(techFile)) {
    console.error(`${BACKLOG}/${item}/tech.md: missing`);
    process.exit(1);
  }
  const paths = readTechPaths(readFileSync(techFile, 'utf8'));
  const changes = gitChanges(REPO_ROOT, process.env.WB_BASE);
  if (changes === undefined) process.exit(1);
  console.log(
    writeInterfaces(item, compareFiles(changes.changes, [...paths.added, ...paths.changed])),
  );
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
