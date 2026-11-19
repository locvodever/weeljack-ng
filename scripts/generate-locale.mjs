// @ts-check
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { format, resolveConfig } from 'prettier';
import { ROOT } from './entries.mjs';

/**
 * `generate:locale` (FR-15). Turns the pinned devDependency `@openng/optimus-ui-locale` into the two
 * source files the library ships: the English default `_WJ_EN` (`private`, the root's merge base and
 * `locale`'s `en`) and `locale/vi.ts`. Each file carries 08 Q3's header and is formatted with the
 * repo's Prettier config, so `npm run lint` and the drift check never disagree.
 *
 * `--check` writes nothing and exits 1 when a committed file differs from what would be written;
 * `npm run build` runs it first.
 *
 * @typedef {Record<string, unknown>} Dictionary
 */
const PACKAGE = join(ROOT, 'node_modules', '@openng', 'optimus-ui-locale');
const LIBRARY = join(ROOT, 'projects', 'weeljack-ng');

/** WeeljackNg's own `wj` keys taken from an upstream `aria` key. */
const OWN_FROM_UPSTREAM = {
  showPassword: 'passwordShow',
  hidePassword: 'passwordHide',
  otpCharacter: 'otpLabel',
};

/** Own `wj` keys with no upstream equivalent: one row per language. */
/** @type {Record<string, Record<string, string>>} */
const OWN_STRINGS = {
  en: {
    breadcrumb: 'Breadcrumb',
    home: 'Home',
    moreActions: 'More actions',
    actions: 'Actions',
    invalidFileSizeSummary: '{0}: Invalid file size,',
    invalidFileSizeDetail: 'maximum upload size is {0}.',
    invalidFileTypeSummary: '{0}: Invalid file type,',
    invalidFileTypeDetail: 'allowed file types: {0}.',
    invalidFileLimitSummary: 'Maximum number of files exceeded,',
    invalidFileLimitDetail: 'limit is {0} at most.',
    terminalCommand: 'Command',
    toggleOn: 'Yes',
    toggleOff: 'No',
    colorArea: 'Saturation and brightness',
    colorAreaValue: 'Saturation {s}%, brightness {b}%',
    colorHue: 'Hue',
  },
  vi: {
    breadcrumb: 'Đường dẫn',
    home: 'Trang chủ',
    moreActions: 'Thêm thao tác',
    actions: 'Thao tác',
    invalidFileSizeSummary: '{0}: Kích thước tập tin không hợp lệ,',
    invalidFileSizeDetail: 'kích thước tải lên tối đa là {0}.',
    invalidFileTypeSummary: '{0}: Loại tập tin không hợp lệ,',
    invalidFileTypeDetail: 'các loại tập tin được phép: {0}.',
    invalidFileLimitSummary: 'Đã vượt quá số lượng tập tin tối đa,',
    invalidFileLimitDetail: 'giới hạn tối đa là {0}.',
    terminalCommand: 'Lệnh',
    toggleOn: 'Có',
    toggleOff: 'Không',
    colorArea: 'Độ bão hòa và độ sáng',
    colorAreaValue: 'Độ bão hòa {s}%, độ sáng {b}%',
    colorHue: 'Sắc độ',
  },
};

/** @type {{ lang: string, file: string, code: (json: string) => string }[]} */
const OUTPUTS = [
  {
    lang: 'en',
    file: join(LIBRARY, 'private', 'translation-en.ts'),
    code: (json) =>
      `/**\n * The English default \`provideWeeljack\` merges \`translation\` over, and \`weeljack-ng/locale\`'s \`en\`.\n *\n * @docs-private\n */\nexport const _WJ_EN = ${json};\n`,
  },
  {
    lang: 'vi',
    file: join(LIBRARY, 'locale', 'vi.ts'),
    code: (json) =>
      `import type { WjTranslation } from 'weeljack-ng';\n\n/** Vietnamese UI strings: every key of \`en\`, plus WeeljackNg's own. */\nexport const vi: WjTranslation = ${json};\n`,
  },
];

/** @param {unknown} value @returns {value is Dictionary} */
function isDictionary(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** @param {string} lang @returns {Dictionary} the language's strings, language key unwrapped */
function readStrings(lang) {
  /** @type {unknown} */
  const json = JSON.parse(readFileSync(join(PACKAGE, `${lang}.json`), 'utf8'));
  const strings = isDictionary(json) ? json[lang] : undefined;
  if (!isDictionary(strings) || !isDictionary(strings['aria'])) {
    throw new Error(
      `generate-locale: ${lang}.json has no \`${lang}\` object with an \`aria\` group.`,
    );
  }
  return strings;
}

/** @param {string} lang @param {Dictionary} strings @returns {Dictionary} strings plus the `wj` group */
function withOwnGroup(lang, strings) {
  const aria = /** @type {Dictionary} */ (strings['aria']);
  /** @type {Dictionary} */
  const wj = {};
  for (const [own, upstream] of Object.entries(OWN_FROM_UPSTREAM)) {
    const value = aria[upstream];
    if (typeof value !== 'string') {
      throw new Error(`generate-locale: ${lang}.json has no aria.${upstream} for wj.${own}.`);
    }
    wj[own] = value;
  }
  return { ...strings, wj: { ...wj, ...OWN_STRINGS[lang] } };
}

/** @returns {string[]} the `LICENSE`'s copyright lines, verbatim */
function copyrightLines() {
  const lines = readFileSync(join(PACKAGE, 'LICENSE'), 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.startsWith('Copyright'));
  if (lines.length === 0) {
    throw new Error('generate-locale: the package LICENSE has no copyright line.');
  }
  return lines;
}

/** @param {string} lang @returns {string} 08 Q3's header */
function header(lang) {
  /** @type {{ version: string }} */
  const { version } = JSON.parse(readFileSync(join(PACKAGE, 'package.json'), 'utf8'));
  return [
    '/*',
    ' * SPDX-License-Identifier: MIT',
    ` * Adapted from @openng/optimus-ui-locale ${version}, ${lang}.json`,
    ...copyrightLines().map((line) => ` * ${line}`),
    ' * Modifications Copyright (c) 2026 Loc Vo',
    ' *',
    ' * Generated by scripts/generate-locale.mjs (npm run generate:locale). Do not edit.',
    ' */',
    '',
  ].join('\n');
}

/** @param {string} file @param {string} source @returns {Promise<string>} Prettier-formatted */
async function pretty(file, source) {
  const options = await resolveConfig(file);
  return format(source, { ...options, filepath: file });
}

const check = process.argv.includes('--check');
const stale = [];
for (const { lang, file, code } of OUTPUTS) {
  const json = JSON.stringify(withOwnGroup(lang, readStrings(lang)));
  const text = await pretty(file, `${header(lang)}\n${code(json)}`);
  const current = existsSync(file) ? readFileSync(file, 'utf8') : undefined;
  if (current === text) continue;
  const name = relative(ROOT, file).split(sep).join('/');
  if (check) {
    stale.push(name);
  } else {
    writeFileSync(file, text, 'utf8');
    console.log(`generate-locale: wrote ${name}`);
  }
}
if (stale.length > 0) {
  console.error(
    `generate-locale: ${stale.join(', ')} differ from the generated output. Run \`npm run generate:locale\` and commit the result.`,
  );
  process.exit(1);
}
