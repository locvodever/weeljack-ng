// @ts-check
/**
 * Pure licence-gate module, no side effects at import. Ported from quanoi's `licence-gate.mjs`
 * (the allow-list test and the offender evaluation), with two deliberate departures (FR-33):
 * the allow-list drops MPL-2.0, Unlicense and CC0-1.0, and the package set is the shipped
 * closure computed by `check-licences.mjs`, not a lockfile production walk (every package here is
 * a root devDependency).
 */

/** @type {ReadonlySet<string>} the licences the shipped closure may carry (CLAUDE.md § 10) */
export const ALLOWED = new Set([
  'MIT',
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'ISC',
  '0BSD',
]);

/**
 * The licence expression a package manifest declares, or `undefined` when it declares none.
 * Handles the SPDX string, the legacy `{ type }` object and the legacy `licenses` array.
 * @param {{ license?: unknown, licenses?: unknown }} manifest
 * @returns {string | undefined}
 */
export function licenceOf(manifest) {
  /** @param {unknown} value @returns {string | undefined} */
  const one = (value) => {
    if (typeof value === 'string') return value.trim() === '' ? undefined : value.trim();
    if (typeof value === 'object' && value !== null && 'type' in value) return one(value.type);
    return undefined;
  };
  const single = one(manifest.license);
  if (single !== undefined) return single;
  if (Array.isArray(manifest.licenses)) {
    const all = manifest.licenses.map(one);
    if (all.length > 0 && all.every((licence) => licence !== undefined)) {
      return `(${all.join(' OR ')})`;
    }
  }
  return undefined;
}

/**
 * Whether a licence expression passes the allow-list.
 * - Not a non-empty string: refused (missing licence).
 * - `SEE LICENSE IN ...`, `UNLICENSED`, `Custom:` and guessed (`*`-suffixed) values: refused,
 *   because none is in {@link ALLOWED}.
 * - `A AND B` needs every member allowed; `A OR B` needs one; a bare id must be in the list.
 * @param {unknown} licence
 * @returns {boolean}
 */
export function isAllowed(licence) {
  if (typeof licence !== 'string' || licence.length === 0) return false;
  if (licence.endsWith('*') || licence.startsWith('Custom:')) return false;
  const cleaned = licence.replace(/^\(|\)$/g, '');
  if (/\sAND\s/.test(cleaned)) {
    return cleaned.split(/\s+AND\s+/).every((part) => ALLOWED.has(part.trim()));
  }
  return cleaned.split(/\s+OR\s+/).some((part) => ALLOWED.has(part.trim()));
}

/**
 * @param {Map<string, string | undefined>} closure `name@version` -> declared licence
 * @returns {{ ok: boolean, offenders: string[] }}
 */
export function evaluate(closure) {
  if (closure.size === 0) return { ok: false, offenders: ['the shipped closure is empty'] };
  const offenders = [...closure]
    .filter(([, licence]) => !isAllowed(licence))
    .map(([nameVersion, licence]) => `${nameVersion}: ${licence ?? '(no licence field)'}`);
  return { ok: offenders.length === 0, offenders };
}
