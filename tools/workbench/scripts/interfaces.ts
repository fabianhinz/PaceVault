import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { compareFiles, gitChanges } from './changedFiles.ts';
import type { FileChange, FilesComparison } from './reviewArtifactsContract.ts';
import { BACKLOG_DIR, REPO_ROOT, baseRevisionOverride } from './paths.ts';
import { itemTechPaths } from './itemCli.ts';

const TS_FILE = /\.tsx?$/;

type InterfaceFiles = { files: string[]; missing: string[] };

type ChangedInterfaceFile = { path: string; planned: boolean };

type ChangedInterfaceFiles = { files: ChangedInterfaceFile[]; missing: string[] };

const isTypeScript = (path: string) => TS_FILE.test(path) && !path.endsWith('.d.ts');

export const changedInterfaceFiles = (comparison: FilesComparison): ChangedInterfaceFiles => {
  const typeScriptChanges = ({ changes, planned }: { changes: FileChange[]; planned: boolean }) =>
    changes
      .filter((change) => change.status !== 'deleted' && isTypeScript(change.path))
      .map((change) => ({ path: change.path, planned }));
  return {
    files: [
      ...typeScriptChanges({ changes: comparison.planned, planned: true }),
      ...typeScriptChanges({ changes: comparison.notPlanned, planned: false }),
    ],
    missing: comparison.untouched.filter((path) => isTypeScript(path) || path.endsWith('/')),
  };
};

const typeScriptFilesBelow = ({ root, dir }: { root: string; dir: string }): string[] =>
  readdirSync(join(root, dir), { withFileTypes: true })
    .filter((entry) => entry.name !== 'node_modules')
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return typeScriptFilesBelow({ root, dir: path });
      if (isTypeScript(entry.name)) return [path];
      return [];
    });

export const interfaceFiles = ({
  root,
  paths,
}: {
  root: string;
  paths: string[];
}): InterfaceFiles => {
  const files: string[] = [];
  const missing: string[] = [];
  for (const plannedPath of paths) {
    const path = plannedPath.replace(/\/+$/, '');
    const absolute = join(root, path);
    if (!existsSync(absolute)) {
      if (TS_FILE.test(path) || plannedPath.endsWith('/')) missing.push(plannedPath);
      continue;
    }
    let found: string[] = [];
    if (statSync(absolute).isDirectory()) found = typeScriptFilesBelow({ root, dir: path });
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

const nearestConfig = ({ root, file }: { root: string; file: string }): string | undefined => {
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
  const configRead = ts.readConfigFile(config, (path) => ts.sys.readFile(path));
  if (configRead.error !== undefined) return { options: DEFAULT_OPTIONS, rootNames: [] };
  const parsedConfig = ts.parseJsonConfigFileContent(configRead.config, ts.sys, dirname(config));
  return {
    options: { ...parsedConfig.options, noEmit: true },
    rootNames: parsedConfig.fileNames.filter((name) => name.endsWith('.d.ts')),
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
const relativeImports = ({ text, root }: { text: string; root: string }): string =>
  text.replaceAll(/import\("([^"]+)"\)/g, (whole, path: string) => {
    if (!path.startsWith('/')) return whole;
    return `import("${relative(root, path)}")`;
  });

/** Longer one-line types break their outermost object literals over lines, as Oxfmt would. */
const MAX_PRINT_WIDTH = 100;

const multiline = (node: ts.Node): void => {
  if (ts.isTypeLiteralNode(node)) {
    ts.setEmitFlags(node, ts.EmitFlags.None);
    return;
  }
  ts.forEachChild(node, multiline);
};

const printNode = ({ node, file }: { node: ts.Node; file: ts.SourceFile }): string => {
  const line = printer.printNode(ts.EmitHint.Unspecified, node, file);
  if (line.length <= MAX_PRINT_WIDTH) return line;
  multiline(node);
  return reindent(printer.printNode(ts.EmitHint.Unspecified, node, file));
};

type Printing = { checker: ts.TypeChecker; file: ts.SourceFile };

const localDeclaration = ({
  file,
  name,
}: {
  file: ts.SourceFile;
  name: string;
}): ts.InterfaceDeclaration | ts.TypeAliasDeclaration | undefined =>
  file.statements.find(
    (statement): statement is ts.InterfaceDeclaration | ts.TypeAliasDeclaration =>
      (ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement)) &&
      statement.name.text === name,
  );

const localPropsText = ({
  local,
  file,
}: {
  local: ts.InterfaceDeclaration | ts.TypeAliasDeclaration;
  file: ts.SourceFile;
}): string => {
  if (ts.isTypeAliasDeclaration(local)) return local.type.getText(file);
  const body = file.text.slice(local.members.pos - 1, local.end);
  const bases = (local.heritageClauses ?? []).flatMap((clause) =>
    clause.types.map((base) => base.getText(file)),
  );
  return [...bases, body].join(' & ');
};

const propsText = (parameter: ts.Symbol, context: Printing): string | undefined => {
  const declaration = parameter.valueDeclaration;
  if (declaration === undefined || declaration.getSourceFile() !== context.file) return undefined;
  if (!ts.isParameter(declaration) || declaration.type === undefined) return undefined;
  const typeNode = declaration.type;
  if (ts.isTypeLiteralNode(typeNode)) return typeNode.getText(context.file);
  if (!ts.isTypeReferenceNode(typeNode) || !ts.isIdentifier(typeNode.typeName)) return undefined;
  if (typeNode.typeArguments !== undefined) return undefined;
  const localTypeDeclaration = localDeclaration({
    file: context.file,
    name: typeNode.typeName.text,
  });
  if (localTypeDeclaration === undefined) return undefined;
  return localPropsText({ local: localTypeDeclaration, file: context.file });
};

const printType = (
  { type, at, component }: { type: ts.Type; at: ts.Node; component: boolean },
  context: Printing,
): string => {
  const checker = context.checker;
  const signatures = type.getCallSignatures();
  if (signatures.length === 1 && type.getProperties().length === 0) {
    const signature = signatures[0];
    const parameters = signature.getParameters();
    if (component && parameters.length === 1) {
      const props = propsText(parameters[0], context);
      const returns = checker.typeToTypeNode(signature.getReturnType(), at, BUILDER_FLAGS);
      if (props !== undefined && returns !== undefined) {
        const name = parameters[0].getName();
        return `(${name}: ${props}) => ${printNode({ node: returns, file: context.file })}`;
      }
    }
    const declaration = checker.signatureToSignatureDeclaration(
      signature,
      ts.SyntaxKind.FunctionType,
      at,
      BUILDER_FLAGS,
    );
    if (declaration !== undefined) return printNode({ node: declaration, file: context.file });
  }
  const node = checker.typeToTypeNode(type, at, BUILDER_FLAGS);
  if (node === undefined) return checker.typeToString(type, at, ts.TypeFormatFlags.NoTruncation);
  return printNode({ node, file: context.file });
};

const isExported = (node: ts.Node): boolean => {
  if (!ts.canHaveModifiers(node)) return false;
  const modifiers = ts.getModifiers(node) ?? [];
  return modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
};

const isComponentName = (name: string, context: Printing): boolean =>
  context.file.fileName.endsWith('.tsx') && /^[A-Z]/.test(name);

const valueLine = (
  { keyword, name, at }: { keyword: string; name: string; at: ts.Node },
  context: Printing,
): string => {
  const symbol = context.checker.getSymbolAtLocation(at);
  if (symbol === undefined) return `export ${keyword} ${name}: unknown;`;
  const type = context.checker.getTypeOfSymbolAtLocation(symbol, at);
  const printed = printType({ type, at, component: isComponentName(name, context) }, context);
  return `export ${keyword} ${name}: ${printed};`;
};

const statementExports = (statement: ts.Statement, context: Printing): string[] => {
  if (ts.isExportDeclaration(statement)) return [statement.getText(context.file)];
  if (ts.isExportAssignment(statement)) {
    const type = context.checker.getTypeAtLocation(statement.expression);
    return [
      `export default ${printType({ type, at: statement.expression, component: false }, context)};`,
    ];
  }
  if (!isExported(statement)) return [];
  if (ts.isVariableStatement(statement)) {
    let keyword = 'const';
    if ((statement.declarationList.flags & ts.NodeFlags.Let) !== 0) keyword = 'let';
    return statement.declarationList.declarations.map((declaration) =>
      valueLine(
        { keyword, name: declaration.name.getText(context.file), at: declaration.name },
        context,
      ),
    );
  }
  if (ts.isFunctionDeclaration(statement) && statement.name !== undefined) {
    return [
      valueLine({ keyword: 'const', name: statement.name.text, at: statement.name }, context),
    ];
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

export const extractInterfaces = ({
  root,
  files,
}: {
  root: string;
  files: string[];
}): Map<string, string[]> => {
  const groups = new Map<string | undefined, string[]>();
  for (const file of files) {
    const config = nearestConfig({ root, file });
    groups.set(config, [...(groups.get(config) ?? []), file]);
  }
  const exportsByFile = new Map<string, string[]>();
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
        exportsByFile.set(file, []);
        continue;
      }
      const context = { checker, file: source };
      const lines = source.statements.flatMap((statement) => statementExports(statement, context));
      exportsByFile.set(
        file,
        lines.map((line) => relativeImports({ text: line, root: resolve(root) })),
      );
    }
  }
  return exportsByFile;
};

export const renderInterfaces = ({
  item,
  generated,
  found,
  exports,
}: {
  item: string;
  generated: string;
  found: ChangedInterfaceFiles;
  exports: Map<string, string[]>;
}): string => {
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

export const writeInterfaces = ({
  item,
  comparison,
}: {
  item: string;
  comparison: FilesComparison;
}): string => {
  const found = changedInterfaceFiles(comparison);
  const exports = extractInterfaces({
    root: REPO_ROOT,
    files: found.files.map((file) => file.path),
  });
  const generated = new Date().toISOString().slice(0, 10);
  const review = join(REPO_ROOT, BACKLOG_DIR, item, 'review');
  mkdirSync(review, { recursive: true });
  writeFileSync(
    join(review, 'interfaces.md'),
    renderInterfaces({ item, generated, found, exports }),
  );
  const countOf = (planned: boolean) =>
    found.files
      .filter((file) => file.planned === planned)
      .reduce((sum, file) => sum + (exports.get(file.path) ?? []).length, 0);
  const unplanned = found.files.filter((file) => !file.planned).length;
  return `${BACKLOG_DIR}/${item}/review/interfaces.md: ${found.files.length - unplanned} planned files · ${countOf(true)} exports, ${unplanned} not planned files · ${countOf(false)} exports, ${found.missing.length} missing`;
};

const main = () => {
  const cli = itemTechPaths('interfaces');
  const changes = gitChanges({ root: REPO_ROOT, override: baseRevisionOverride() });
  if (changes === undefined) process.exit(1);
  console.log(
    writeInterfaces({
      item: cli.item,
      comparison: compareFiles({
        changes: changes.changes,
        plannedPaths: [...cli.paths.added, ...cli.paths.changed],
      }),
    }),
  );
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
