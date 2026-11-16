/*
 * `weeljack-ng/private`: helpers shared by the root entry and the component entries. Every export
 * is `_`-prefixed and `@docs-private`, and the entry sits outside semver (01 Q4, ADR 0004).
 */
export {
  _checkAriaOnHost,
  _checkWeeljackSetup,
  _warnOnce,
  _WJ0010,
  _WJ_PROVIDED,
} from './dev-warnings';
export { _wjId } from './ids';
export { _mergePartAttributes, type _PartAttributeValue } from './part-attributes';
