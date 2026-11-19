/*
 * `weeljack-ng/private`: helpers shared by the root entry and the component entries. Every export
 * is `_`-prefixed and `@docs-private`, and the entry sits outside semver (01 Q4, ADR 0004).
 */
export {
  _CONFIRM_DIALOG_KEY,
  _CONFIRM_POPUP_KEY,
  _confirmationHosts,
  _registerConfirmationHost,
  _WJ_CONFIRMATIONS,
} from './confirmation';
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
export { _checkNotInField } from './in-field-label';
export {
  _toOptimusMegaMenuModel,
  _toOptimusMenuModel,
  type _MegaMenuItemShape,
  type _MenuItemShape,
  type _OptimusMenuModel,
} from './menu-model';
export {
  _drawerPassThrough,
  _focusIntoOverlay,
  _OVERLAY_CLOSE_BUTTON,
  _OVERLAY_MOTION,
  _overlayCloseLabel,
  _overlayDrawer,
  _overlayEscapeGate,
  _overlayFocusTarget,
  _overlayLifecycle,
  type _OverlayLifecycle,
  type _OverlayRegion,
} from './overlay';
export { _mergePartAttributes, type _PartAttributeValue } from './part-attributes';
export { _ptContextFlag } from './pt-context';
export { _touchedOnLeave } from './touch-on-leave';
export { _WJ_EN } from './translation-en';
export { _copyTree, type _TreeCopy } from './tree-copy';
export { _bridgeAccessor, type _AccessorHost } from './value-accessor';
export { _ariaStrings, _wjStrings, type _AriaStringKey, type _WjStringKey } from './wj-strings';
