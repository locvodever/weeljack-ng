// @ts-check
import {
  EntryType,
  MemberTags,
  MemberType,
  NgtscProgram,
  isDocEntryWithSourceInfo,
  createCompilerHost,
  readConfiguration,
} from '@angular/compiler-cli';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

/**
 * API extraction (FR-24, 07 Q6). Runs `NgtscProgram#getApiDocumentation` over every shipped
 * component entry and writes `projects/docs/src/generated/api/<entry>.json` plus `index.json`,
 * which the docs app renders and prerenders its component routes from.
 *
 * The extractor is exported but undocumented (no semver promise). The fallback is Compodoc 2.0's
 * JSON export (07 Q6). Its empty-entry guard runs here, so `build:docs` fails on it.
 *
 * What the extractor lacks is read from the source instead: `PropertyEntry` has no default value,
 * so the default is the first argument of the `input()` / `model()` initialiser.
 *
 * @typedef {import('@angular/compiler-cli').DocEntry} DocEntry
 * @typedef {import('@angular/compiler-cli').DirectiveEntry} DirectiveEntry
 * @typedef {import('@angular/compiler-cli').PropertyEntry} PropertyEntry
 * @typedef {import('@angular/compiler-cli').ConstantEntry} ConstantEntry
 * @typedef {import('@angular/compiler-cli').ClassEntry} ClassEntry
 * @typedef {import('@angular/compiler-cli').MethodEntry} MethodEntry
 * @typedef {import('@angular/compiler-cli').ParameterEntry} ParameterEntry
 *
 * @typedef {{ name: string, alias: string, type: string, description: string,
 *   defaultValue: string | null, required: boolean }} ApiMember
 * @typedef {{ name: string, kind: 'component' | 'directive', selector: string,
 *   description: string, inputs: ApiMember[], outputs: ApiMember[], models: ApiMember[] }} ApiClass
 * @typedef {{ name: string, type: string, description: string }} ApiType
 * @typedef {{ name: string, signature: string, description: string }} ApiMethod
 * @typedef {{ name: string, type: string, description: string, readonly: boolean }} ApiProperty
 * @typedef {{ name: string, providedIn: string | null, description: string,
 *   methods: ApiMethod[], properties: ApiProperty[] }} ApiService
 * @typedef {{ entry: string, importPath: string, classes: ApiClass[], types: ApiType[],
 *   services: ApiService[] }} ApiDocument
 */

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const libraryRoot = join(root, 'projects', 'weeljack-ng');
const outDir = join(root, 'projects', 'docs', 'src', 'generated', 'api');

/** Secondary entries that are not component entries: they get no page and no guard. */
const NON_COMPONENT_ENTRIES = new Set(['private', 'locale']);

/** @param {string} path */
function toPosix(path) {
  return path.split(sep).join('/');
}

/** Every `weeljack-ng/<entry>` folder (one level deep) that carries an `ng-package.json`. */
function discoverEntries() {
  return readdirSync(libraryRoot, { withFileTypes: true })
    .filter((item) => item.isDirectory())
    .map((item) => item.name)
    .filter((name) => existsSync(join(libraryRoot, name, 'ng-package.json')))
    .filter((name) => !NON_COMPONENT_ENTRIES.has(name))
    .sort();
}

/** Collapses JSDoc line wrapping so a description is one line of text. */
function oneLine(/** @type {string} */ text) {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Splits `text` at the first top-level comma (outside `<>`, `()`, `[]`, `{}` and quotes).
 * @param {string} text
 */
function firstTypeArgument(text) {
  let depth = 0;
  let quote = '';
  for (let index = 0; index < text.length; index += 1) {
    const char = text.charAt(index);
    if (quote !== '') {
      if (char === quote) quote = '';
    } else if (char === "'" || char === '"' || char === '`') {
      quote = char;
    } else if ('<([{'.includes(char)) {
      depth += 1;
    } else if ('>)]}'.includes(char)) {
      depth -= 1;
    } else if (char === ',' && depth === 0) {
      return text.slice(0, index).trim();
    }
  }
  return text.trim();
}

/**
 * `InputSignal<T>`, `InputSignalWithTransform<T, U>`, `ModelSignal<T>` and `OutputEmitterRef<T>`
 * become `T`: the docs show the value type, not the signal wrapper.
 * @param {string} type
 */
function valueType(type) {
  const match =
    /^(?:InputSignal|InputSignalWithTransform|ModelSignal|OutputEmitterRef)<(.*)>$/s.exec(type);
  return match?.[1] === undefined ? type : firstTypeArgument(match[1]);
}

/**
 * Reads `input(...)` / `input.required(...)` / `model(...)` initialisers of one class.
 * @param {ts.SourceFile} source
 * @param {string} className
 * @returns {Map<string, { required: boolean, defaultValue: string | null }>}
 */
function readInitialisers(source, className) {
  /** @type {Map<string, { required: boolean, defaultValue: string | null }>} */
  const found = new Map();
  /** @param {ts.Node} node */
  const visit = (node) => {
    if (ts.isClassDeclaration(node) && node.name?.text === className) {
      for (const member of node.members) {
        if (
          !ts.isPropertyDeclaration(member) ||
          !ts.isIdentifier(member.name) ||
          member.initializer === undefined ||
          !ts.isCallExpression(member.initializer)
        ) {
          continue;
        }
        const callee = member.initializer.expression;
        const required =
          ts.isPropertyAccessExpression(callee) &&
          callee.name.text === 'required' &&
          ts.isIdentifier(callee.expression) &&
          ['input', 'model'].includes(callee.expression.text);
        const plain = ts.isIdentifier(callee) && ['input', 'model'].includes(callee.text);
        if (!required && !plain) continue;
        const first = member.initializer.arguments[0];
        found.set(member.name.text, {
          required,
          defaultValue: required
            ? null
            : first === undefined
              ? 'undefined'
              : oneLine(first.getText(source)),
        });
      }
    } else {
      ts.forEachChild(node, visit);
    }
  };
  visit(source);
  return found;
}

/**
 * The program's source file for a doc entry.
 * @param {DocEntry} entry
 * @param {ts.Program} tsProgram
 */
function sourceFor(entry, tsProgram) {
  if (!isDocEntryWithSourceInfo(entry)) {
    throw new Error(`extract-api: ${entry.name} has no source location.`);
  }
  const filePath = entry.source.filePath;
  // The extractor strips the program's current directory from the path with a plain string
  // replace. On Linux that leaves `/projects/...`, so join it back; on Windows the separators
  // differ, nothing is stripped, and the path is already absolute.
  const source =
    tsProgram.getSourceFile(filePath) ??
    tsProgram.getSourceFile(toPosix(join(tsProgram.getCurrentDirectory(), filePath)));
  if (source === undefined) {
    throw new Error(`extract-api: ${filePath} is not in the program.`);
  }
  return source;
}

/**
 * `@Injectable({ providedIn })` of a class: `undefined` when the class is not `@Injectable`,
 * otherwise the `providedIn` source text (quotes stripped) or `null` when it has none.
 * @param {ts.SourceFile} source
 * @param {string} className
 * @returns {string | null | undefined}
 */
function readInjectable(source, className) {
  /** @type {string | null | undefined} */
  let result;
  /** @param {ts.Node} node */
  const visit = (node) => {
    if (ts.isClassDeclaration(node) && node.name?.text === className) {
      for (const decorator of ts.getDecorators(node) ?? []) {
        const call = decorator.expression;
        if (!ts.isCallExpression(call) || call.expression.getText(source) !== 'Injectable')
          continue;
        result = null;
        const options = call.arguments[0];
        if (options !== undefined && ts.isObjectLiteralExpression(options)) {
          for (const property of options.properties) {
            if (
              ts.isPropertyAssignment(property) &&
              property.name.getText(source) === 'providedIn'
            ) {
              result = property.initializer.getText(source).replace(/^['"`]|['"`]$/g, '');
            }
          }
        }
      }
    } else {
      ts.forEachChild(node, visit);
    }
  };
  visit(source);
  return result;
}

/** @param {{ jsdocTags: { name: string }[], name: string }} item */
function isPrivateMember(item) {
  return (
    item.name.startsWith('_') ||
    item.name.startsWith('#') ||
    item.jsdocTags.some((tag) => tag.name === 'docs-private')
  );
}

/** @param {ParameterEntry} param */
function paramText(param) {
  return `${param.isRestParam ? '...' : ''}${param.name}${param.isOptional ? '?' : ''}: ${param.type}`;
}

/**
 * An exported `@Injectable` class: public methods and public properties, never `@docs-private`
 * or `_`-prefixed members.
 * @param {ClassEntry} entry
 * @param {string | null} providedIn
 * @returns {ApiService}
 */
function toApiService(entry, providedIn) {
  /** @type {ApiService} */
  const service = {
    name: entry.name,
    providedIn,
    description: oneLine(entry.description),
    methods: [],
    properties: [],
  };
  for (const member of entry.members) {
    if (
      isPrivateMember(member) ||
      member.name === 'constructor' ||
      member.memberTags.includes(MemberTags.Protected)
    ) {
      continue;
    }
    if (member.memberType === MemberType.Method) {
      const method = /** @type {MethodEntry} */ (member);
      const signatures =
        method.signatures.length > 0
          ? method.signatures
          : method.implementation === null
            ? []
            : [method.implementation];
      for (const signature of signatures) {
        service.methods.push({
          name: member.name,
          signature: `${member.name}(${signature.params.map(paramText).join(', ')}): ${signature.returnType}`,
          description: oneLine(member.description || signature.description),
        });
      }
    } else if (
      member.memberType === MemberType.Property ||
      member.memberType === MemberType.Getter
    ) {
      const property = /** @type {PropertyEntry} */ (member);
      service.properties.push({
        name: member.name,
        type: property.type,
        description: oneLine(member.description),
        readonly:
          member.memberTags.includes(MemberTags.Readonly) ||
          member.memberType === MemberType.Getter,
      });
    }
  }
  return service;
}

/** @param {ts.Expression | undefined} node @returns {string[]} the string literals of an array */
function stringList(node) {
  if (node === undefined || !ts.isArrayLiteralExpression(node)) return [];
  return node.elements.filter(ts.isStringLiteralLike).map((element) => element.text);
}

/**
 * The class a `hostDirectives` entry points at, followed through an import.
 * @param {ts.Expression} expression
 * @param {ts.TypeChecker} checker
 */
function declarationOf(expression, checker) {
  let symbol = checker.getSymbolAtLocation(expression);
  if (symbol !== undefined && symbol.flags & ts.SymbolFlags.Alias) {
    symbol = checker.getAliasedSymbol(symbol);
  }
  return symbol?.declarations?.find(ts.isClassDeclaration);
}

/**
 * Inputs and outputs a class re-exposes through `hostDirectives: [{ directive, inputs, outputs }]`
 * (`'name'` or `'name: alias'`). The host directive's own class is the source of the row: the type
 * is the checker's type of its member, the default is its `input()` / `model()` initialiser, and
 * the description is that member's JSDoc.
 * @param {ts.SourceFile} source
 * @param {string} className
 * @param {ts.TypeChecker} checker
 * @returns {{ inputs: ApiMember[], outputs: ApiMember[], models: ApiMember[] }}
 */
function readHostDirectiveMembers(source, className, checker) {
  const result = {
    inputs: /** @type {ApiMember[]} */ ([]),
    outputs: /** @type {ApiMember[]} */ ([]),
    models: /** @type {ApiMember[]} */ ([]),
  };
  /** @param {ts.Node} node */
  const visit = (node) => {
    if (!ts.isClassDeclaration(node) || node.name?.text !== className) {
      ts.forEachChild(node, visit);
      return;
    }
    for (const decorator of ts.getDecorators(node) ?? []) {
      const call = decorator.expression;
      const options = ts.isCallExpression(call) ? call.arguments[0] : undefined;
      if (options === undefined || !ts.isObjectLiteralExpression(options)) continue;
      const hosts = options.properties.find(
        (property) =>
          ts.isPropertyAssignment(property) && property.name.getText(source) === 'hostDirectives',
      );
      if (
        hosts === undefined ||
        !ts.isPropertyAssignment(hosts) ||
        !ts.isArrayLiteralExpression(hosts.initializer)
      )
        continue;
      for (const host of hosts.initializer.elements) {
        if (!ts.isObjectLiteralExpression(host)) continue;
        /** @param {string} key */
        const prop = (key) => {
          const found = host.properties.find(
            (property) =>
              ts.isPropertyAssignment(property) && property.name.getText(source) === key,
          );
          return found !== undefined && ts.isPropertyAssignment(found)
            ? found.initializer
            : undefined;
        };
        const directive = prop('directive');
        const declaration = directive === undefined ? undefined : declarationOf(directive, checker);
        if (declaration?.name === undefined) continue;
        const initialisers = readInitialisers(declaration.getSourceFile(), declaration.name.text);
        for (const kind of /** @type {const} */ (['inputs', 'outputs'])) {
          for (const exposed of stringList(prop(kind))) {
            const [name = '', alias = name] = exposed.split(':').map((part) => part.trim());
            // An exposed input may be inherited (Optimus's `pt` lives on its base class), so the
            // checker's property lookup, not only the class's own members, finds it.
            const symbol = checker.getTypeAtLocation(declaration).getProperty(name);
            const member = symbol?.declarations?.[0];
            if (member === undefined || symbol === undefined) {
              throw new Error(
                `extract-api: ${className} exposes "${name}", which ${declaration.name.text} does not declare.`,
              );
            }
            const type = checker.typeToString(checker.getTypeOfSymbolAtLocation(symbol, member));
            const initialiser = initialisers.get(name);
            /** @type {ApiMember} */
            const api = {
              name,
              alias,
              type: valueType(type),
              description: oneLine(
                ts.displayPartsToString(symbol.getDocumentationComment(checker)),
              ),
              defaultValue: initialiser?.defaultValue ?? null,
              required: initialiser?.required ?? false,
            };
            if (kind === 'outputs') result.outputs.push(api);
            else if (type.startsWith('ModelSignal<')) result.models.push(api);
            else result.inputs.push(api);
          }
        }
      }
    }
  };
  visit(source);
  return result;
}

/**
 * @param {DirectiveEntry} entry
 * @param {ts.Program} tsProgram
 * @returns {ApiClass}
 */
function toApiClass(entry, tsProgram) {
  if (!isDocEntryWithSourceInfo(entry)) {
    throw new Error(`extract-api: ${entry.name} has no source location.`);
  }
  const source = sourceFor(entry, tsProgram);
  const initialisers = readInitialisers(source, entry.name);

  /** @type {ApiClass} */
  const result = {
    name: entry.name,
    kind: entry.entryType === EntryType.Component ? 'component' : 'directive',
    selector: entry.selector,
    description: oneLine(entry.description),
    inputs: [],
    outputs: [],
    models: [],
  };

  for (const member of /** @type {PropertyEntry[]} */ (entry.members)) {
    const isInput = member.memberTags.includes(MemberTags.Input);
    const isOutput = member.memberTags.includes(MemberTags.Output);
    if (!isInput && !isOutput) continue;
    if (member.memberTags.includes(MemberTags.Protected)) continue;
    const initialiser = initialisers.get(member.name);
    /** @type {ApiMember} */
    const api = {
      name: member.name,
      alias: (isInput ? member.inputAlias : member.outputAlias) ?? member.name,
      type: valueType(member.type),
      description: oneLine(member.description),
      defaultValue: initialiser?.defaultValue ?? null,
      required: member.isRequiredInput ?? false,
    };
    if (isInput && isOutput) {
      result.models.push(api);
    } else if (isInput) {
      result.inputs.push(api);
    } else {
      result.outputs.push(api);
    }
  }
  const hosted = readHostDirectiveMembers(source, entry.name, tsProgram.getTypeChecker());
  const own = new Set([...result.inputs, ...result.outputs, ...result.models].map((m) => m.alias));
  for (const key of /** @type {const} */ (['inputs', 'outputs', 'models'])) {
    result[key].push(...hosted[key].filter((member) => !own.has(member.alias)));
  }
  return result;
}

const config = readConfiguration(join(libraryRoot, 'tsconfig.lib.json'));
if (config.errors.length > 0) {
  throw new Error(
    `extract-api: tsconfig.lib.json has errors:\n${config.errors.map((error) => String(error.messageText)).join('\n')}`,
  );
}
const program = new NgtscProgram(
  config.rootNames,
  config.options,
  createCompilerHost({ options: config.options }),
);
const tsProgram = program.getTsProgram();

mkdirSync(outDir, { recursive: true });
const entries = discoverEntries();
/** @type {string[]} */
const failures = [];

for (const entry of entries) {
  const entryPoint = toPosix(resolve(libraryRoot, entry, 'public-api.ts'));
  const { entries: docEntries } = program.getApiDocumentation(entryPoint, new Set());

  /** @type {ApiDocument} */
  const document = {
    entry,
    importPath: `weeljack-ng/${entry}`,
    classes: [],
    types: [],
    services: [],
  };
  for (const docEntry of docEntries) {
    if (docEntry.entryType === EntryType.Component || docEntry.entryType === EntryType.Directive) {
      document.classes.push(toApiClass(/** @type {DirectiveEntry} */ (docEntry), tsProgram));
    } else if (docEntry.entryType === EntryType.UndecoratedClass) {
      const providedIn = readInjectable(sourceFor(docEntry, tsProgram), docEntry.name);
      if (providedIn !== undefined && !isPrivateMember(docEntry)) {
        document.services.push(toApiService(/** @type {ClassEntry} */ (docEntry), providedIn));
      }
    } else if (docEntry.entryType === EntryType.TypeAlias) {
      const alias = /** @type {ConstantEntry} */ (docEntry);
      document.types.push({
        name: alias.name,
        type: oneLine(alias.type),
        description: oneLine(alias.description),
      });
    }
  }
  document.classes.sort((a, b) => a.name.localeCompare(b.name));
  document.types.sort((a, b) => a.name.localeCompare(b.name));
  document.services.sort((a, b) => a.name.localeCompare(b.name));

  // Empty-entry guard (07 Q6): a shipped component entry must yield an input or an output, or, for
  // an entry whose public surface is a service, a public service method.
  const memberCount = document.classes.reduce(
    (total, item) => total + item.inputs.length + item.outputs.length + item.models.length,
    0,
  );
  const methodCount = document.services.reduce((total, item) => total + item.methods.length, 0);
  if ((document.classes.length === 0 || memberCount === 0) && methodCount === 0) {
    failures.push(
      `weeljack-ng/${entry}: the extractor found ${String(document.classes.length)} component(s), ${String(memberCount)} input/output member(s) and ${String(methodCount)} service method(s). A shipped component entry must yield at least one input or output, or a service method. Check ${relative(root, join(libraryRoot, entry, 'public-api.ts'))}, or the extractor itself (undocumented API; fallback: Compodoc 2.0 JSON, 07 Q6).`,
    );
    continue;
  }
  writeFileSync(join(outDir, `${entry}.json`), `${JSON.stringify(document, null, 2)}\n`);
  console.log(
    `extract-api: ${entry} -> ${String(document.classes.length)} class(es), ${String(document.services.length)} service(s), ${String(memberCount)} member(s)`,
  );
}

if (failures.length > 0) {
  console.error(`extract-api: empty-entry guard failed:\n  ${failures.join('\n  ')}`);
  process.exit(1);
}

/** @type {{ version: string }} */
const libraryManifest = JSON.parse(readFileSync(join(libraryRoot, 'package.json'), 'utf8'));
writeFileSync(
  join(outDir, 'index.json'),
  `${JSON.stringify({ version: libraryManifest.version, entries }, null, 2)}\n`,
);
console.log(
  `extract-api: index.json -> ${entries.join(', ')} (version ${libraryManifest.version})`,
);
