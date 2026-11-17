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
export {
  _registerWithField,
  _WJ_FIELD_CONTEXT,
  type _WjFieldContext,
  type _WjFieldControl,
} from './field-context';
export { _wjId } from './ids';
export {
  _drawerPassThrough,
  _focusIntoOverlay,
  _OVERLAY_CLOSE_BUTTON,
  _OVERLAY_MOTION,
  _overlayCloseLabel,
  _overlayDrawer,
  _overlayEscapeGate,
  _overlayLifecycle,
  type _OverlayLifecycle,
  type _OverlayRegion,
} from './overlay';
export { _mergePartAttributes, type _PartAttributeValue } from './part-attributes';
export { _WJ_EN } from './translation-en';
export { _bridgeAccessor, type _AccessorHost } from './value-accessor';
export { _wjStrings, type _WjStringKey } from './wj-strings';
